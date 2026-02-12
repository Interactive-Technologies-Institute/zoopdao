import { goto } from '$app/navigation';
import { supabase } from '@/supabase';
import {
	PEDAGOGIC_ROUND7_USER_PROMPTS_DEFAULT,
	PEDAGOGIC_ROUND7_USER_PROMPTS_MAX,
	PEDAGOGIC_ROUNDS_TIMER_MINUTES
} from '$lib/config/organization';
import { getCharacterCategory } from '../types';
import { ROLES, type Role } from '../types';
import type {
	Card,
	Game,
	GameRound,
	GameStateEnum,
	Player,
	PlayerAnswer,
	PlayerCard,
	PlayerId,
	PlayerState,
	Round
} from '../types';

export class GameState {
	cards: Card[];
	rounds: Round[];
	code: string = $state('');
	state: GameStateEnum = $state('starting');
	gameRounds: GameRound[] = $state([]);
	currentRound: number = $derived.by(() => {
		if (this.gameRounds.length === 0) return 0;
		return Math.max(...this.gameRounds.map((round) => round.round));
	});
	playerId: PlayerId = $state(0);
	players: Player[] = $state([]);
	playersCards: PlayerCard[] = $state([]);
	playersAnswers: PlayerAnswer[] = $state([]);
	playersState: Record<PlayerId, PlayerState> = $derived.by(() => {
		return this.players.reduce<Record<PlayerId, PlayerState>>((acc, player) => {
			acc[player.id] = this.buildPlayerState(player.id);
			return acc;
		}, {});
	});

	roundTimerDuration: number = $state(0);
	mode: 'pedagogic' | 'decision_making' = $state('pedagogic');
	pedagogicRoundsTimerMinutes: number = $state(PEDAGOGIC_ROUNDS_TIMER_MINUTES);
	pedagogicRound7UserPrompts: number = $state(PEDAGOGIC_ROUND7_USER_PROMPTS_DEFAULT);
	private activityInterval: ReturnType<typeof setInterval> | null = null;
	private beforeUnloadHandler: (() => void) | null = null;
	private unloadTimeout: ReturnType<typeof setTimeout> | null = null;

	private clampRound7UserPrompts(value: unknown): number {
		const num = typeof value === 'number' ? value : Number(value);
		if (!Number.isFinite(num)) return PEDAGOGIC_ROUND7_USER_PROMPTS_DEFAULT;
		return Math.max(1, Math.min(PEDAGOGIC_ROUND7_USER_PROMPTS_MAX, Math.floor(num)));
	}

	getPedagogicRound7UserPrompts(): number {
		return this.clampRound7UserPrompts(this.pedagogicRound7UserPrompts);
	}

	private getOnboardingProfile(): {
		roleType: string | null;
		customRole: string | null;
		name: string | null;
		description: string | null;
	} {
		// The new home onboarding stores role/name/description in localStorage.
		// We use it to populate the saved discussion "cargo" even if the legacy lobby is bypassed.
		if (typeof window === 'undefined') {
			return { roleType: null, customRole: null, name: null, description: null };
		}
		try {
			const raw = localStorage.getItem('zoopdao:onboarding:v1');
			if (!raw) return { roleType: null, customRole: null, name: null, description: null };
			const parsed = JSON.parse(raw) as {
				role?: Role | 'other' | null;
				customRole?: string;
				name?: string;
				description?: string;
			};

			const role = parsed.role ?? null;
			const customRole = (parsed.customRole ?? '').trim();
			const name = (parsed.name ?? '').trim();
			const description = (parsed.description ?? '').trim();

			let roleType: string | null = null;
			if (role && role !== 'other' && (ROLES as string[]).includes(role as string)) {
				roleType = role as string;
			}

			return {
				roleType,
				customRole: role === 'other' && customRole.length > 0 ? customRole : null,
				name: name.length > 0 ? name : null,
				description: description.length > 0 ? description : null
			};
		} catch {
			return { roleType: null, customRole: null, name: null, description: null };
		}
	}

	getGameId(): number {
		// Find a player's game_id (they all share the same game_id)
		const gameId = this.players?.[0]?.game_id;
		if (!gameId) {
			console.error('Could not find game ID for filtering subscriptions');
			return -1; // Return a value that won't match any real game ID
		}
		return gameId;
	}

	constructor(
		cards: Card[],
		rounds: Round[],
		game: Game & { mode?: 'pedagogic' | 'decision_making' | null },
		gameRounds: GameRound[],
		playerId: PlayerId,
		players: Player[],
		playerCards: PlayerCard[],
		playerAnswers: PlayerAnswer[],
		mode: 'pedagogic' | 'decision_making' = 'pedagogic'
	) {
		this.cards = cards;
		this.rounds = rounds;
		this.code = game.code;
		this.state = game.state as GameStateEnum;
		this.mode = mode;
		// Use per-game pedagogic config when present (falls back to organization defaults).
		const roundsMinutes: unknown = (game as any).pedagogic_rounds_timer_minutes;
		const round7UserPrompts: unknown = (game as any).pedagogic_round7_user_prompts;
		if (typeof roundsMinutes === 'number' && Number.isFinite(roundsMinutes)) {
			this.pedagogicRoundsTimerMinutes = roundsMinutes;
		}
		this.pedagogicRound7UserPrompts = this.clampRound7UserPrompts(round7UserPrompts);
		this.gameRounds = gameRounds;
		this.playerId = playerId;
		this.players = players;
		this.playersCards = playerCards;
		this.playersAnswers = playerAnswers;

		if (this.unloadTimeout) {
			clearTimeout(this.unloadTimeout);
			this.unloadTimeout = null;
		}

		this.initializeTimerState();
		this.setupActivityTracking();
		this.setupPageUnloadDetection();

		this.subscribeGame();
		this.subscribeGameRounds();
		this.subscribePlayers();
		this.subscribePlayerCards();
		this.subscribePlayerAnswers();
		this.subscribeGameRounds();
		this.subscribeRoundTimer();
	}

	private setupActivityTracking() {
		this.activityInterval = setInterval(async () => {
			if (this.code && this.state !== 'finished') {
				await this.updatePlayerActivity();
			}
		}, 30000);

		this.updatePlayerActivity();
	}

	private setupPageUnloadDetection() {
		if (typeof window !== 'undefined') {
			this.beforeUnloadHandler = () => {
				if (this.unloadTimeout) clearTimeout(this.unloadTimeout);

				const currentPlayer = this.players.find((p) => p.id === this.playerId);
				if (!currentPlayer) return;

				const formData = new FormData();
				formData.append('code', this.code);
				formData.append('userId', currentPlayer.user_id);

				// Delay marking inactive by 10 seconds
				this.unloadTimeout = setTimeout(() => {
					navigator.sendBeacon('/api/mark-inactive', formData);
				}, 10000);
			};

			window.addEventListener('beforeunload', this.beforeUnloadHandler);
			window.addEventListener('pagehide', this.beforeUnloadHandler);
		}
	}

	private async updatePlayerActivity() {
		try {
			await supabase.rpc('update_player_activity', {
				game_code: this.code
			});
		} catch (error) {
			console.error('Failed to update player activity:', error);
		}
	}

	async markPlayerInactive() {
		try {
			// Get userId from the current player in the players array
			const currentPlayer = this.players.find((p) => p.id === this.playerId);
			if (!currentPlayer) {
				console.error('Current player not found');
				return false;
			}

			const response = await fetch('/api/mark-inactive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					code: this.code,
					userId: currentPlayer.user_id
				})
			});

			if (response.ok) {
				// Update local state
				this.players = this.players.map((p) =>
					p.id === this.playerId ? { ...p, is_active: false } : p
				);
				return true;
			}

			return false;
		} catch (err) {
			console.error('Error marking player inactive:', err);
			return false;
		}
	}

	public cleanup() {
		// Clear activity tracking interval
		if (this.activityInterval) {
			clearInterval(this.activityInterval);
			this.activityInterval = null;
		}

		// Remove page unload event listeners
		if (typeof window !== 'undefined' && this.beforeUnloadHandler) {
			window.removeEventListener('beforeunload', this.beforeUnloadHandler);
			window.removeEventListener('pagehide', this.beforeUnloadHandler);
			this.beforeUnloadHandler = null;
		}

		// Unsubscribe from all Supabase channels
		supabase.channel('game').unsubscribe();
		supabase.channel('game_rounds').unsubscribe();
		supabase.channel('players').unsubscribe();
		supabase.channel('player_cards').unsubscribe();
		supabase.channel('player_answers').unsubscribe();
		supabase.channel('round_timers').unsubscribe();

		// Optional: Clear all reactive state arrays to prevent memory leaks
		this.players = [];
		this.playersCards = [];
		this.playersAnswers = [];
		this.gameRounds = [];
	}

	// Add this method to initialize timer state
	private initializeTimerState() {
		// Find the current round
		const currentRound = this.gameRounds.find((r) => r.round === this.currentRound);

		// If the current round has timer data, initialize the timer state
		if (currentRound && currentRound.timer_duration) {
			this.roundTimerDuration = currentRound.timer_duration;
		} else {
			this.roundTimerDuration = 0;
		}
	}

	async subscribeGame() {
		supabase
			.channel('game')
			.on<Game>(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'games',
					filter: `code=eq.${this.code}`
				},
				(payload) => {
					const game = payload.new as Game;
					const state = game.state;
					if (state === 'waiting' || state === 'ready') {
						supabase.channel('game').unsubscribe();
						goto(`/${this.code}/lobby`);
						return;
					}
					this.state = game.state as GameStateEnum;
				}
			)
			.subscribe();
	}

	async subscribeGameRounds() {
		supabase
			.channel('game_rounds')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'game_rounds',
					filter: `game_id=eq.${this.getGameId()}`
				},
				(payload) => {
					const gameRound = payload.new as GameRound;
					this.gameRounds.push(gameRound);
				}
			)
			.subscribe();
	}

	async subscribePlayers() {
		supabase
			.channel('players')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'players',
					filter: `game_id=eq.${this.getGameId()}`
				},
				(payload) => {
					const player = payload.new as Player;
					if (this.players.find((p) => p.id === player.id)) {
						this.players = this.players.map((p) => (p.id === player.id ? player : p));
					} else {
						this.players.push(player);
					}
				}
			)
			.subscribe();
	}

	async subscribePlayerCards() {
		supabase
			.channel('player_cards')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'player_cards',
					filter: `game_id=eq.${this.getGameId()}`
				},
				(payload) => {
					this.playersCards.push(payload.new as PlayerCard);
				}
			)
			.subscribe();
	}

	async subscribePlayerAnswers() {
		supabase
			.channel('player_answers')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'player_answers',
					filter: `game_id=eq.${this.getGameId()}`
				},
				(payload) => {
					// Check if this is an INSERT event
					if (payload.eventType === 'INSERT') {
						this.playersAnswers.push(payload.new as PlayerAnswer);
					}
					// Check if this is an UPDATE event
					else if (payload.eventType === 'UPDATE') {
						// Update the existing answer instead of adding a new one
						const updatedAnswer = payload.new as PlayerAnswer;
						this.playersAnswers = this.playersAnswers.map((answer) =>
							answer.id === updatedAnswer.id ? updatedAnswer : answer
						);
					}
				}
			)
			.subscribe();
	}

	buildPlayerState(playerId: PlayerId): PlayerState {
		const cards = this.playersCards.filter((card) => card.player_id === playerId);
		const answers = this.playersAnswers.filter((answer) => answer.player_id === playerId);

		const currentAnswer = answers.find((answer) => answer.round === this.currentRound);

		// Round 0 - Introduction
		if (this.currentRound === 0) {
			return !currentAnswer ? { state: 'writing' } : { state: 'done' };
		}

		// Rounds 1-7: Discussion rounds
		if (this.currentRound >= 1 && this.currentRound <= 7) {
			if (!currentAnswer) {
				return { state: 'writing' };
			} else {
				return { state: 'done' };
			}
		}

		// Fallback (should not reach here for valid rounds)
		return { state: 'starting' };
	}

	async playerStart() {
		// For discussion rounds (rounds 1-7), use player_start_discussion
		// This function marks that the player has started the discussion round
		const { error } = await (supabase.rpc as any)('player_start_discussion', {
			game_code: this.code
		});
		if (error) {
			console.error(error);
		}
	}

	async playerMove() {
		if (this.mode === 'pedagogic' || this.mode === 'decision_making') {
			return;
		}

		const currentPlayer = this.players.find(p => p.id === this.playerId);
		if (!currentPlayer) {
			console.error('Current player not found');
			return;
    	}

		const characterCategory = getCharacterCategory(currentPlayer.character ?? 'child');

		const heroStep = Math.min(Math.max(this.currentRound, 1), 6);
		console.log("Hero step:", heroStep);
		console.log("Character category:", characterCategory);

		const { error } = await (supabase.rpc as any)('player_next_discussion', {
			game_code: this.code,
			game_round: this.currentRound,
			p_hero_step: heroStep,
			p_character_category: characterCategory
		});
		if (error) {
			console.error(error);
		}
	}

	async submitAnswer(answer: string) {
		const { error } = await supabase.rpc('player_answer', {
			game_code: this.code,
			game_round: this.currentRound,
			answer
		});
		if (error) {
			console.error(error);
			return;
		}
		await this.refreshGameRounds();
	}

	async saveStory(
		name: string,
		title: string,
		discussionRound7Text?: string,
		vote?: 'yes' | 'no' | 'abstain' | null,
		proposalId?: number | null
	) {
		const character = this.players.find((player) => player.id === this.playerId);
		if (!character) return;
		const onboarding = this.getOnboardingProfile();

		// For round 7, get discussion messages instead of player answer
		let round7Answer = '';
		const round7PlayerAnswer = this.playersAnswers.find(
			(pa) => pa.player_id === this.playerId && pa.round === 7
		);

		if (discussionRound7Text && discussionRound7Text.trim().length > 0) {
			round7Answer = discussionRound7Text;
		} else if (!round7PlayerAnswer || round7PlayerAnswer.answer.trim() === '') {
			// If there's no player answer for round 7, try to get discussion messages
			try {
				const { getDiscussionMessages } = await import('@/utils/discussion-messages');
				const gameId = this.getGameId();
				if (gameId > 0) {
					const messages = await getDiscussionMessages(supabase, gameId, { round: 7 });
					if (messages.length > 0) {
						round7Answer = messages
							.map(msg => {
								const senderName = msg.participantType === 'human' 
									? 'You' 
									: (msg.agentRole ? msg.agentRole.charAt(0).toUpperCase() + msg.agentRole.slice(1) : 'AI Agent');
								return `${senderName}: ${msg.content}`;
							})
							.join('\n\n');
					}
				}
			} catch (error) {
				console.error('Error loading round 7 discussion messages:', error);
			}
		} else {
			round7Answer = round7PlayerAnswer.answer;
		}

		// Build rounds data with card types and answers
		const roundsData = Array.from({ length: 8 }, (_, i) => {
			const card = this.playersCards.find((pc) => pc.player_id === this.playerId && pc.round === i);
			const cardDetails = card ? this.cards.find((c) => c.id === card.card_id) : null;
			const answer = this.playersAnswers.find(
				(pa) => pa.player_id === this.playerId && pa.round === i
			);

			// For round 7, use discussion messages if available
			const answerText = i === 7 ? round7Answer : (answer?.answer || '');

			return {
				round: i,
				card_id: card?.card_id || null,
				type: cardDetails?.type || null,
				answer: answerText,
				public_story: true
			};
		}).reduce<Record<number, { card_id: number | null; type: string | null; answer: string }>>(
			(acc, round, index) => {
				acc[index] = round;
				return acc;
			},
			{}
		);

		// Get unique card types
		const cardTypes = Array.from(
			new Set(
				Object.values(roundsData)
					.map((round) => round.type)
					.filter((type): type is string => type !== null)
			)
		);

		// Combine all answers into full story
		const fullStory = Object.values(roundsData)
			.map((round) => round.answer)
			.filter((answer) => answer.trim().length > 0)
			.join('\n\n');

		const { data, error } = await (supabase.rpc as any)('save_discussion', {
			p_player_name: name,
			p_discussion_title: title,
			p_character: {
				// Persist the selected role (new system) so it can be shown later in Browse histories.
				// Fallback keeps compatibility with any legacy `character` field that might exist in older data.
				// Keep "type" compatible with CharacterCard assets: use role key, or 'custom' when "Outro" is used.
				// The free-text role name is stored in custom_role for display.
				type:
					(onboarding.customRole ? 'custom' : onboarding.roleType) ??
					(character as any).role ??
					(character as any).character ??
					'custom',
				custom_role: onboarding.customRole ?? null,
				nickname:
					(onboarding.name ?? '').trim() ||
					(character.nickname?.trim() ? character.nickname : name),
				description: onboarding.description ?? character.description
			},
			p_rounds: roundsData,
			p_card_types: cardTypes,
			p_full_discussion: fullStory,
			p_vote: vote ?? null,
			p_proposal_id: proposalId ?? null,
			p_discussion_mode: this.mode
		});

		if (error) {
			console.error('Error saving story:', error);
			return false;
		}

		return data;
	}
	private async refreshGameRounds() {
		const gameId = this.getGameId();
		if (gameId === -1) return;

		const { data, error } = await supabase
			.from('game_rounds')
			.select('*')
			.eq('game_id', gameId)
			.order('round', { ascending: true });

		if (error) {
			console.error('Failed to refresh game rounds:', error);
			return;
		}

		if (data) {
			this.gameRounds = data as GameRound[];
					}
	}

	async startRoundTimer() {
		// Only start timer in pedagogic mode
		if (this.mode !== 'pedagogic') {
			return false;
		}

		// Round 7 is prompt-limited (no timer).
		if (this.currentRound === 7) {
			this.roundTimerDuration = 0;
			return false;
		}

		// Determine duration based on round:
		// Rounds 1-6 share the same timer duration.
		const durationMinutes = this.pedagogicRoundsTimerMinutes;
		const durationSeconds = durationMinutes * 60;

		const currentGameRound = this.gameRounds.find((r) => r.round === this.currentRound);
		if (!currentGameRound) {
			console.error('Cannot find current game round to start timer');
			return false;
		}

		this.roundTimerDuration = durationSeconds;

		const { error } = await supabase
			.from('game_rounds')
			.update({ timer_duration: durationSeconds })
			.eq('id', currentGameRound.id);

		if (error) {
			console.error('Failed to save timer duration:', error);
			return false;
		}

		return true;
	}

	getTimerDurationForRound(round: number): number {
		// Only return duration in pedagogic mode
		if (this.mode !== 'pedagogic') {
			return 0;
		}
		// Round 7 is prompt-limited (no timer).
		if (round === 7) return 0;
		return this.pedagogicRoundsTimerMinutes * 60;
	}

	async subscribeRoundTimer() {
		supabase
			.channel('round_timers')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'game_rounds',
					filter: `game_id=eq.${this.getGameId()}`
				},
				(payload) => {
					const updatedRound = payload.new as GameRound;

					// Only update timer state if this is for the current round
					if (updatedRound.round === this.currentRound) {
						if (updatedRound.timer_duration) {
							this.roundTimerDuration = updatedRound.timer_duration;
						}
					}

					// Update the game rounds array
					this.gameRounds = this.gameRounds.map((round) =>
						round.id === updatedRound.id ? { ...round, ...updatedRound } : round
					);
				}
			)
			.subscribe();
	}

	async updatePlayerAnswer(answerId: number, newText: string) {
		try {
			const { error } = await supabase
				.from('player_answers')
				.update({ answer: newText })
				.eq('id', answerId);

			if (error) throw error;

			// Update local state
			this.playersAnswers = this.playersAnswers.map((answer) =>
				answer.id === answerId ? { ...answer, answer: newText } : answer
			);

			return true;
		} catch (error) {
			console.error('Error updating answer:', error);
			return false;
		}
	}
}
