import { goto } from '$app/navigation';
import { getLocale } from '@src/paraglide/runtime.js';
import { supabase } from '@/supabase';
import type {
	Card,
	Game,
	GameId,
	GameRound,
	Player,
	PlayerAnswer,
	PlayerCard,
	Round
} from '@/types';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, parent }) => {
	const { userId } = await parent();
	const code = params.code;

	async function getGame(): Promise<Game & { proposal_id?: number | null; mode?: 'pedagogic' | 'decision_making' | null }> {
		// Select proposal_id and mode explicitly since they're not in the generated types yet
		const { data: gameData, error: gameError } = await (supabase
			.from('games')
			.select('*')
			.eq('code', code)
			.single()) as any;

		if (gameError) {
			return error(404, { message: 'Discussion not found' });
		}

		return gameData as Game & { proposal_id?: number | null; mode?: 'pedagogic' | 'decision_making' | null };
	}

	async function getPlayers(gameId: GameId): Promise<Player[]> {
		const { data: playersData, error: playersError } = await supabase
			.from('players')
			.select('*')
			.eq('game_id', gameId);

		if (playersError) {
			return error(500, { message: 'Error fetching participants' });
		}

		return playersData;
	}

	async function getRounds(): Promise<Round[]> {
		const { data: roundsData, error: roundsError } = await supabase.from('rounds').select('*').order('index', { ascending: true });

		if (roundsError) {
			console.error('Error fetching rounds:', roundsError);
			return error(500, { message: 'Error fetching rounds' });
		}

		console.log('Rounds loaded from database:', roundsData);
		return roundsData || [];
	}

	async function getCards(): Promise<Card[]> {
		const { data: cardsData, error: cardsError } = await supabase
			.from('cards')
			.select('id, type, title, hero_steps, character_category, prompt_text(text)')
			.eq('prompt_text.lang', getLocale());

		if (cardsError) {
			return error(500, { message: 'Error fetching cards' });
		}

		const cards = cardsData.map((card) => ({
			id: card.id,
			type: card.type,
			title: card.title,
			hero_steps: card.hero_steps,
			character_category: card.character_category as Card['character_category'],
			text: card.prompt_text[0].text ?? ''
		}));

		return cards;
	}

	async function getGameRounds(gameId: GameId): Promise<GameRound[]> {
		const { data: gameRoundsData, error: gameRoundsError } = await supabase
			.from('game_rounds')
			.select('*')
			.eq('game_id', gameId);

		if (gameRoundsError) {
			return error(500, { message: 'Error fetching discussion rounds' });
		}

		return gameRoundsData;
	}

	async function getPlayerCards(gameId: GameId): Promise<PlayerCard[]> {
		const { data: playerCardsData, error: playerCardsError } = await supabase
			.from('player_cards')
			.select('*')
			.eq('game_id', gameId);

		if (playerCardsError) {
			return error(500, { message: 'Error fetching participant cards' });
		}

		return playerCardsData;
	}

	async function getPlayerAnswers(gameId: GameId): Promise<PlayerAnswer[]> {
		const { data: playerAnswersData, error: playerAnswersError } = await supabase
			.from('player_answers')
			.select('*')
			.eq('game_id', gameId);

		if (playerAnswersError) {
			return error(500, { message: 'Error fetching participant answers' });
		}

		return playerAnswersData;
	}

	const game = await getGame();

	// Lobby is deprecated. Allow entering the assembly for all normal game states.
	if (!['waiting', 'ready', 'starting', 'playing', 'finished'].includes(game.state as string)) {
		return redirect(302, '/');
	}

	const players = await getPlayers(game.id);

	const player = players.find((player) => player.user_id === userId);

	if (!player) {
		return error(403, { message: 'You are not a participant in this discussion' });
	}

	const rounds = await getRounds();
	const cards = await getCards();

	const gameRounds = await getGameRounds(game.id);
	const playerCards = await getPlayerCards(game.id);
	const playerAnswers = await getPlayerAnswers(game.id);
	const proposalId = game.proposal_id ?? null;
	let proposalTitle: string | null = null;
	if (proposalId) {
		const { data: proposalData } = await supabase
			.from('proposals')
			.select('title')
			.eq('id', proposalId)
			.single();
		proposalTitle = proposalData?.title ?? null;
	}

	// Check if player was inactive and if they can rejoin
	if (player.is_active === false) {
		const currentRound = gameRounds.length > 0 ? gameRounds[gameRounds.length - 1].round : 0;
		const playerLastRound = Math.max(
			...playerCards.filter((c) => c.player_id === player.id).map((c) => c.round),
			...playerAnswers.filter((a) => a.player_id === player.id).map((a) => a.round),
			0
		);

		// Don't allow rejoin if too far behind
		if (currentRound - playerLastRound > 1) {
			goto('/');
			return error(403, {
				message: 'You cannot rejoin this discussion as it has progressed too far.'
			});
		}

		// Reactivate the player
		await supabase.rpc('update_player_activity', { game_code: code });
		await supabase.from('players').update({ is_active: true }).eq('id', player.id);

		player.is_active = true;
	}

	return {
		cards,
		rounds,
		game,
		players,
		playerId: player.id,
		gameRounds,
		playerCards,
		playerAnswers,
		proposalId,
		proposalTitle,
		gameMode: game.mode ?? 'pedagogic'
	};
};
