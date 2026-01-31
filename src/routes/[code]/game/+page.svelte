<script lang="ts">
	import HelpDialog from '@/components/help-dialog.svelte';
	import Map from '@/components/map.svelte';
	import ParticipantsContainer from '@/components/participants-container.svelte';
	import RoundIndicator from '@/components/round-indicator.svelte';
	import StoryDialog from '@/components/story-dialog.svelte';
	import DiscussionInputBar from '@/components/discussion-input-bar.svelte';
	import DiscussionHistoryDialog from '@/components/discussion-history-dialog.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { GameState } from '@/state/game-state.svelte';
	import { CircleHelp, ScrollText, LogOut, FileText } from 'lucide-svelte';
	import type { PageData } from './$types';
	import EndDialog from '@/components/end-dialog.svelte';
	import { m } from '@src/paraglide/messages';
	import fanfare from '@/sounds/fanfare.mp3';
	import bubbles from '@/sounds/bubbles-sound-effect.mp3';
	import { onMount, onDestroy } from 'svelte';
	import { createGameTour } from '@/components/ui/shepherd/game-tour.svelte.js';
	import type { Tour } from 'shepherd.js';
	import RoundTransition from '@/components/round-transition.svelte';
	import { goto } from '$app/navigation';
	import StatusPill from '@/components/status-pill.svelte';
	import ProposalDialog from '@/components/proposal-dialog.svelte';
	import Timer from '@/components/timer.svelte';
	import { calculateAIAgentsCount, generateAIAgents, createParticipants } from '@/utils/participants';
	import type { AIAgent, AIMessage, Participant, Role } from '@/types';
	import { supabase } from '@/supabase';
	import {
		storeHumanMessage,
		getDiscussionMessages,
		getChatHistoryForAI,
		storeAIMessage,
		mapDiscussionMessageRow
	} from '@/utils/discussion-messages';
	import { AquariumLayoutState } from '@/state/aquarium-layout.svelte';
	import { DiscussionTimelineState, type TimelineMessage } from '@/state/discussion-timeline.svelte';

	let tour: Tour | undefined;

	let fanfareAudio: HTMLAudioElement;
	let startupAudio: HTMLAudioElement;

	let tourCompleted = $state(false);

	// Ensure overlay is removed when tour completes
	$effect(() => {
		if (tourCompleted) {
			// Use setTimeout to ensure DOM is updated
			setTimeout(() => {
				const overlay = document.querySelector('.shepherd-modal-overlay-container');
				if (overlay) {
					overlay.remove();
				}
				// Also remove any shepherd elements
				const shepherdElements = document.querySelectorAll('.shepherd-element');
				shepherdElements.forEach(el => el.remove());
			}, 100);
		}
	});

	onMount(() => {
		fanfareAudio = new Audio(fanfare);
		fanfareAudio.volume = 0.;
		startupAudio = new Audio(bubbles);
		startupAudio.volume = 0.0;

		if (gameState.state === 'starting') {
			tour = createGameTour();
			tour.on('complete', () => {
				tourCompleted = true;
				// Ensure overlay is removed
				const overlay = document.querySelector('.shepherd-modal-overlay-container');
				if (overlay) {
					overlay.remove();
				}
			});
			tour.on('cancel', () => {
				tourCompleted = true;
				// Ensure overlay is removed
				const overlay = document.querySelector('.shepherd-modal-overlay-container');
				if (overlay) {
					overlay.remove();
				}
			});
			tour.start();
		} else {
			if (tour) {
				tour.complete();
				tour.cancel();
			}
			tour = undefined;
			tourCompleted = true;
			// Ensure overlay is removed
			const overlay = document.querySelector('.shepherd-modal-overlay-container');
			if (overlay) {
				overlay.remove();
			}
		}
	});


	onDestroy(() => {
		if (tour) {
			tour.complete();
			tour.cancel();
		}
		// Ensure overlay is removed
		const overlay = document.querySelector('.shepherd-modal-overlay-container');
		if (overlay) {
			overlay.remove();
		}
		gameState.cleanup();
	});

	let { data }: { data: PageData } = $props();

	// Debug: Check if rounds are loaded
	$effect(() => {
		console.log('Rounds data from page load:', data.rounds);
		console.log('Rounds length:', data.rounds?.length || 0);
	});


	let gameState = new GameState(
		data.cards,
		data.rounds,
		data.game,
		data.gameRounds,
		data.playerId,
		data.players,
		data.playerCards,
		data.playerAnswers,
		data.gameMode
	);

	let aquariumLayout = new AquariumLayoutState();
	let showRoundTransition = $state(false);
	type TransitionState = 'starting' | 'transitioning' | 'ending' | 'ended';
	let transitionState: TransitionState = $state('starting');
	let previousRound = $state(0);
	
	const enableDiscussionChat = true;
	const chatRound = $derived.by(() => gameState.currentRound === 7);
	const SINGLE_AI_MODE_ROUND7 = true;
	const MAX_USER_MESSAGES_ROUND7 = 5;
	const MAX_AI_MESSAGES_ROUND7 = 5;
	const SINGLE_AI_AGENT: AIAgent = {
		id: 'ai-agent-sam',
		name: 'Sam',
		role: 'research'
	};

	
	// Configurable variable for number of discussion rounds with message exchanges
	// This controls how many rounds of messages are exchanged between user and AIs
	// before showing the save history popup
	const DISCUSSION_ROUNDS_COUNT = $derived.by(() =>
		SINGLE_AI_MODE_ROUND7 ? MAX_USER_MESSAGES_ROUND7 : 1
	);
	
	let hasUserChattedThisRound = $state(false);
	let userDraft = $state('');
	let userLastSentMessage = $state<string | null>(null);
	let userIsSending = $state(false);
	const userIsTyping = $derived.by(() => userDraft.trim().length > 0);
	let lastChatRound = $state(-1);
	let discussionRoundCount = $state(0); // Track how many discussion rounds have been completed

	// AI Agents and Participants
	let aiAgents = $state<AIAgent[]>([]);
	let aiMessages = $state<AIMessage[]>([]);
	let typingAgents = $state<Set<string>>(new Set()); // Track which agents are currently typing
	
	// Initialize AI agents based on human players count
	$effect(() => {
		if (!enableDiscussionChat) {
			aiAgents = [];
			aiMessages = [];
			typingAgents = new Set();
			return;
		}
		if (chatRound && SINGLE_AI_MODE_ROUND7) {
			aiAgents = [SINGLE_AI_AGENT];
			return;
		}
		const humanPlayers = gameState.players.filter(p => p.is_active !== false);
		if (humanPlayers.length > 0 && aiAgents.length === 0) {
			try {
				const aiCount = calculateAIAgentsCount(humanPlayers.length);
				aiAgents = generateAIAgents(aiCount);
			} catch (error) {
				console.error('Error initializing AI agents:', error);
			}
		}
	});
	
	// Create participants list (humans + AI)
	const participants = $derived.by(() => {
		const humanPlayers = gameState.players.filter(p => p.is_active !== false);
		const agents = enableDiscussionChat ? aiAgents : [];
		return createParticipants(humanPlayers, agents);
	});
	
	// Generate AI messages after each round completion
	$effect(() => {
		if (gameState.currentRound !== lastChatRound) {
			lastChatRound = gameState.currentRound;
			hasUserChattedThisRound = false;
			userDraft = '';
			userLastSentMessage = null;
			userIsSending = false;
			// Reset discussion round count when entering a new round
			discussionRoundCount = 0;
		}
	});

	$effect(() => {
		if (!enableDiscussionChat || !chatRound || !hasUserChattedThisRound) {
			typingAgents = new Set();
		}
	});

	$effect(() => {
		if (
			gameState.currentRound !== previousRound &&
			gameState.currentRound > 0 &&
			gameState.currentRound < 7
		) {
			showRoundTransition = true;
			transitionState = 'starting';
			previousRound = gameState.currentRound;
		}
	});

	$effect(() => {
		if (gameState.mode !== 'pedagogic') {
			return;
		}
		if (gameState.currentRound < 1 || gameState.currentRound > 7) {
			return;
		}

		const currentGameRound = gameState.gameRounds.find(
			(round) => round.round === gameState.currentRound
		);
		if (currentGameRound && !currentGameRound.timer_duration) {
			gameState.startRoundTimer();
		}
	});

function handleTransitionComplete() {
	showRoundTransition = false;
	if (keepStoryDialogOpen && !chatRound) {
		openStoryDialog = true;
	}
}

	let playerState = $derived.by(() => {
		return gameState.playersState[gameState.playerId].state;
	});

	let currentPlayerState = $derived.by(() => {
		return gameState.playersState[gameState.playerId] || { state: 'done' };
	});

	$effect(() => {
		if (chatRound) {
			keepStoryDialogOpen = false;
			return;
		}
		if (!openStoryDialog && !showRoundTransition) {
			keepStoryDialogOpen = false;
		}
	});

	let openStoryDialog = $state(false);
	let openHelpDialog = $state(false);
	let openEndDialog = $state(false);
	let openProposalDialog = $state(false);
	let openHistoryDialog = $state(false);
	let keepStoryDialogOpen = $state(false);
	let showLayoutDebug = $state(false);
	let safeAreaObserver: ResizeObserver | null = null;

	function updateSafeArea() {
		if (typeof window === 'undefined') return;
		const statusEl = document.querySelector('.status-pill');
		const roundEl = document.querySelector('.round-indicator-wrap');
		const bottomEl =
			document.querySelector('.discussion-controls') ||
			document.querySelector('.discussion-entry-controls');
		const avatarBoundary = document.querySelector('.avatar-boundary');
		const topPadding = 12;
		const bottomPadding = 16;

		const roundBottom = roundEl ? roundEl.getBoundingClientRect().bottom : 0;
		if (roundBottom > 0) {
			// Keep the status pill below the title area to prevent overlap on landscape layouts.
			const minTopPx = 104; // 6.5rem @ 16px base font size
			const desiredTopPx = roundBottom + 12;
			const topForPill = Math.max(minTopPx, desiredTopPx);
			document.documentElement.style.setProperty('--status-pill-top', `${topForPill}px`);
		} else {
			document.documentElement.style.removeProperty('--status-pill-top');
		}

		const statusBottom = statusEl ? statusEl.getBoundingClientRect().bottom : 0;
		const topPx = Math.max(statusBottom, roundBottom) + topPadding;
		const bottomPx = bottomEl
			? window.innerHeight - bottomEl.getBoundingClientRect().top + bottomPadding
			: 0;

		aquariumLayout.setSafeArea(topPx, bottomPx);

		if (avatarBoundary) {
			const sideMargin = Math.max(16, Math.min(72, window.innerWidth * 0.06));
			avatarBoundary.style.top = `${topPx}px`;
			avatarBoundary.style.bottom = `${bottomPx}px`;
			avatarBoundary.style.left = `${sideMargin}px`;
			avatarBoundary.style.right = `${sideMargin}px`;
			const rect = avatarBoundary.getBoundingClientRect();
			aquariumLayout.setContainerRect(rect.left, rect.top, rect.width, rect.height);
		}

		const mapEl = document.querySelector('.map-image') as HTMLImageElement | null;
		if (mapEl) {
			// `object-contain` means the rendered image content may be smaller than the element's box.
			// Use the contained rect so avatar math stays stable across aspect ratios (e.g. iPad landscape).
			const rect = mapEl.getBoundingClientRect();
			const naturalAspect =
				mapEl.naturalWidth && mapEl.naturalHeight ? mapEl.naturalWidth / mapEl.naturalHeight : 1200 / 800;
			const boxAspect = rect.width / rect.height;

			let contentLeft = rect.left;
			let contentTop = rect.top;
			let contentWidth = rect.width;
			let contentHeight = rect.height;

			if (boxAspect > naturalAspect) {
				// Height-limited: horizontal letterboxing.
				contentHeight = rect.height;
				contentWidth = rect.height * naturalAspect;
				contentLeft = rect.left + (rect.width - contentWidth) / 2;
			} else {
				// Width-limited: vertical letterboxing.
				contentWidth = rect.width;
				contentHeight = rect.width / naturalAspect;
				contentTop = rect.top + (rect.height - contentHeight) / 2;
			}

			aquariumLayout.setTableRect(contentLeft, contentTop, contentWidth, contentHeight);
		}
	}

	function attachSafeAreaObservers() {
		if (typeof window === 'undefined') return;
		safeAreaObserver?.disconnect();
		safeAreaObserver = new ResizeObserver(() => updateSafeArea());

		const statusEl = document.querySelector('.status-pill');
		const roundEl = document.querySelector('.round-indicator-wrap');
		const bottomEl =
			document.querySelector('.discussion-controls') ||
			document.querySelector('.discussion-entry-controls');

		if (statusEl) safeAreaObserver.observe(statusEl);
		if (roundEl) safeAreaObserver.observe(roundEl);
		if (bottomEl) safeAreaObserver.observe(bottomEl);
		updateSafeArea();
	}

	onMount(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		showLayoutDebug = params.get('debug') === 'layout';
		attachSafeAreaObservers();
		window.addEventListener('resize', updateSafeArea);
		return () => {
			window.removeEventListener('resize', updateSafeArea);
			safeAreaObserver?.disconnect();
		};
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		chatRound;
		requestAnimationFrame(attachSafeAreaObservers);
	});
	
	// Discussion timeline (single source of truth for history + avatar chat UI)
	let discussionTimeline = new DiscussionTimelineState();
	let lastLoadedDiscussionRound = $state<number | null>(null);

	function splitContentParts(content: string): string[] {
		return content
			.split('\n\n')
			.map((p) => p.trim())
			.filter(Boolean);
	}

	function toTitleCaseRole(role: string) {
		return role.charAt(0).toUpperCase() + role.slice(1);
	}

	function resolveAgentIdByRole(role: Role | null): string | null {
		if (!role) return null;
		const found = aiAgents.find((a) => a.role === role);
		return found?.id ?? null;
	}

	function resolveAgentNameByRole(role: Role | null): string {
		if (!role) return 'AI Agent';
		const found = aiAgents.find((a) => a.role === role);
		return found?.name ?? toTitleCaseRole(role);
	}

	function timelineMessagesFromDbMessage(dbMsg: any): TimelineMessage[] {
		const msg = mapDiscussionMessageRow(dbMsg);
		const parts = splitContentParts(msg.content);
		const senderType = msg.participantType === 'human' ? 'human' : 'ai';
		const isSelf = senderType === 'human' && msg.participantId === data.playerId;

		const role = msg.agentRole as Role | null;
		const resolvedAgentId = resolveAgentIdByRole(role);
		const senderId =
			senderType === 'human'
				? String(msg.participantId ?? 'human')
				: (msg.metadata?.agent_id ?? resolvedAgentId ?? (role ? `role:${role}` : 'ai'));

		const senderName =
			senderType === 'human' ? (isSelf ? 'You' : 'Participant') : resolveAgentNameByRole(role);

		const createdAt = msg.createdAt;
		const dbId = msg.id;
		const clientTempId = msg.metadata?.client_temp_id;

		// Stable per-part keys so we can split/join deterministically for fetch + realtime.
		return (parts.length ? parts : ['']).map((part, idx) => ({
			key: `db:${dbId}:${idx}`,
			dbId,
			clientTempId,
			round: msg.round,
			senderType,
			senderId,
			senderRole: senderType === 'ai' ? (role ?? undefined) : undefined,
			senderName,
			content: part,
			createdAt,
			status: 'sent'
		}));
	}

	function addOptimisticHumanMessage(content: string) {
		const clientTempId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		discussionTimeline.upsert({
			key: `temp:${clientTempId}`,
			clientTempId,
			round: gameState.currentRound,
			senderType: 'human',
			senderId: String(data.playerId),
			senderName: 'You',
			content,
			createdAt: new Date().toISOString(),
			status: 'sending'
		});
		return clientTempId;
	}

	const discussionMessages = $derived.by(() =>
		discussionTimeline.messages.map((msg) => ({
			id: msg.key,
			content: msg.content,
			senderType: msg.senderType,
			senderName: msg.senderName,
			round: msg.round,
			timestamp: new Date(msg.createdAt),
			status: msg.status
		}))
	);

	// Derive per-agent messages for the participants ring from the same timeline.
	$effect(() => {
		if (!enableDiscussionChat || !chatRound || !hasUserChattedThisRound) {
			aiMessages = [];
			return;
		}
		// Re-run when agents are (re)initialized so DB messages can resolve `role:*` ids.
		aiAgents.length;

		const resolveAgentId = (msg: TimelineMessage) => {
			if (msg.senderType !== 'ai') return msg.senderId;
			const role =
				msg.senderRole ??
				(msg.senderId.startsWith('role:') ? (msg.senderId.slice(5) as Role) : null);
			if (role) {
				const found = aiAgents.find((a) => a.role === role);
				if (found) return found.id;
			}
			return msg.senderId.startsWith('role:') ? msg.senderId.slice(5) : msg.senderId;
		};

		aiMessages = discussionTimeline.messages
			.filter((msg) => msg.senderType === 'ai')
			.map((msg) => ({
				id: msg.key,
				agent_id: resolveAgentId(msg),
				round: msg.round,
				content: msg.content,
				created_at: msg.createdAt
			}));
	});

	// Load existing round messages when entering the chat round.
	$effect(() => {
		if (!enableDiscussionChat || !chatRound) {
			discussionTimeline.reset();
			lastLoadedDiscussionRound = null;
			return;
		}
		if (gameState.state !== 'playing' && gameState.state !== 'finished') return;

		const currentRound = gameState.currentRound;
		if (lastLoadedDiscussionRound === currentRound) return;
		lastLoadedDiscussionRound = currentRound;

		const gameId = data.game.id;
		let cancelled = false;
		(async () => {
			try {
				const dbMessages = await getDiscussionMessages(supabase, gameId, { round: currentRound });
				if (cancelled) return;

				const nextTimeline: TimelineMessage[] = [];
				for (const dbMsg of dbMessages) {
					nextTimeline.push(...timelineMessagesFromDbMessage({
						id: dbMsg.id,
						game_id: dbMsg.gameId,
						proposal_id: dbMsg.proposalId,
						round: dbMsg.round,
						participant_type: dbMsg.participantType,
						participant_id: dbMsg.participantId,
						agent_role: dbMsg.agentRole,
						content: dbMsg.content,
						created_at: dbMsg.createdAt,
						metadata: dbMsg.metadata
					}));
				}

				// Replace timeline with DB snapshot for this round. We keep any optimistic entries
				// (they'll be reconciled via client_temp_id or the insert response).
				discussionTimeline.upsert(nextTimeline);

				// If we're coming back/reloading, infer "has user chatted" from persisted messages.
				const hasSelfMessage = dbMessages.some(
					(m) => m.participantType === 'human' && m.participantId === data.playerId && m.round === currentRound
				);
				if (hasSelfMessage) {
					hasUserChattedThisRound = true;
					const last = [...dbMessages]
						.reverse()
						.find((m) => m.participantType === 'human' && m.participantId === data.playerId);
					if (last?.content) userLastSentMessage = last.content;
				}
			} catch (error) {
				console.error('Error loading discussion messages:', error);
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	// Subscribe to realtime inserts so the history dialog updates live while open.
	$effect(() => {
		if (!enableDiscussionChat || !chatRound) return;
		const gameId = data.game.id;
		const currentRound = gameState.currentRound;

		const channel = supabase
			.channel(`discussion_messages:${gameId}:${currentRound}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'discussion_messages',
					filter: `game_id=eq.${gameId}`
				},
				(payload) => {
					try {
						const row = (payload as any).new;
						if (!row) return;
						if (row.round !== currentRound) return;

						const clientTempId = row?.metadata?.client_temp_id;
						if (clientTempId) {
							discussionTimeline.removeByClientTempId(clientTempId);
						}
						discussionTimeline.upsert(timelineMessagesFromDbMessage(row));
					} catch (error) {
						console.error('Failed to ingest realtime discussion message:', error);
					}
				}
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	});

	

	$effect(() => {
		if (gameState.state === 'starting') {
			startupAudio.play();
		}
	});

	// Original logic: Show end dialog when game state is 'finished'
	// This is now commented but kept for reference - the new logic shows the dialog
	// after discussion rounds complete instead
	// $effect(() => {
	// 	if (gameState.state === 'finished') {
	// 		fanfareAudio?.play();
	// 		openEndDialog = true;
	// 	}
	// });
	
	// New logic: Show end dialog after discussion rounds complete
	// Check if discussion round is complete (user sent message + all AIs sent messages + no typing)
	$effect(() => {
		if (chatRound && hasUserChattedThisRound && aiAgents.length > 0) {
			// Check if all AI agents have sent their messages for this round
			const currentRoundMessages = aiMessages.filter(msg => msg.round === gameState.currentRound);
			
			// Get unique agent IDs that have sent messages in this round
			const agentsWhoResponded = new Set(currentRoundMessages.map(msg => msg.agent_id));
			// Check if all agents have responded (each agent should have at least one message)
			const allAgentsResponded = aiAgents.every(agent => agentsWhoResponded.has(agent.id));
			const noAgentsTyping = typingAgents.size === 0;
			const userMessageCount = discussionMessages.filter(
				(msg) => msg.senderType === 'human' && msg.round === gameState.currentRound
			).length;
			const aiMessageCount = currentRoundMessages.length;

			// If all agents have responded and none are typing, discussion round is complete
			if (SINGLE_AI_MODE_ROUND7) {
				if (
					allAgentsResponded &&
					noAgentsTyping &&
					userMessageCount >= MAX_USER_MESSAGES_ROUND7 &&
					aiMessageCount >= MAX_AI_MESSAGES_ROUND7
				) {
					fanfareAudio?.play();
					openEndDialog = true;
				}
				return;
			}

			if (allAgentsResponded && noAgentsTyping && discussionRoundCount < DISCUSSION_ROUNDS_COUNT) {
				discussionRoundCount++;
				// If we've reached the configured number of discussion rounds, show save dialog
				if (discussionRoundCount >= DISCUSSION_ROUNDS_COUNT) {
					fanfareAudio?.play();
					openEndDialog = true;
				}
			}
		}
	});

	async function handleSendMessage(message: string) {
		try {
			if (chatRound) {
				hasUserChattedThisRound = true;
				// Keep the user bubble empty while the new message is being persisted,
				// to avoid flashing the previous message between sends.
				userIsSending = true;
			}
			const gameId = data.game.id;
			const proposalId = data.proposalId || null; // Get proposal_id from loader
			const currentRound = gameState.currentRound;
			const playerId = data.playerId;
			const userMessageCount = discussionMessages.filter(
				(msg) => msg.senderType === 'human' && msg.round === currentRound
			).length;
			const aiMessageCount = aiMessages.filter((msg) => msg.round === currentRound).length;

			if (
				chatRound &&
				SINGLE_AI_MODE_ROUND7 &&
				userMessageCount >= MAX_USER_MESSAGES_ROUND7
			) {
				userIsSending = false;
				alert(m.message_limit_reached());
				return;
			}

			// Optimistic UI: show immediately in timeline/history (even if the history dialog is open).
			const clientTempId = addOptimisticHumanMessage(message);

			// Save human message to database
			const savedMessage = await storeHumanMessage(
				supabase,
				gameId,
				proposalId,
				currentRound,
				playerId,
				message,
				{ clientTempId }
			);

			if (!savedMessage) {
				discussionTimeline.markFailedByClientTempId(clientTempId);
				userIsSending = false;
				console.error('Failed to save message');
				return;
			}
			// Replace optimistic entry with persisted DB message.
			discussionTimeline.removeByClientTempId(clientTempId);
			discussionTimeline.upsert(
				timelineMessagesFromDbMessage({
					id: savedMessage.id,
					game_id: savedMessage.gameId,
					proposal_id: savedMessage.proposalId,
					round: savedMessage.round,
					participant_type: savedMessage.participantType,
					participant_id: savedMessage.participantId,
					agent_role: savedMessage.agentRole,
					content: savedMessage.content,
					created_at: savedMessage.createdAt,
					metadata: savedMessage.metadata
				})
			);
			if (chatRound) {
				userLastSentMessage = savedMessage.content;
				userDraft = '';
				userIsSending = false;
			}


			// Get chat history for AI context (including current round)
			const chatHistory = await getChatHistoryForAI(supabase, gameId, currentRound); // Includes current round messages

			const waitForAiDelay = (ms: number) =>
				SINGLE_AI_MODE_ROUND7
					? Promise.resolve()
					: new Promise((resolve) => setTimeout(resolve, ms));

			// Generate AI agent responses sequentially with delays
			if (
				aiAgents.length > 0 &&
				(!SINGLE_AI_MODE_ROUND7 || aiMessageCount < MAX_AI_MESSAGES_ROUND7)
			) {
				const clearTyping = (agentId: string) => {
					if (typingAgents.has(agentId)) {
						typingAgents.delete(agentId);
						typingAgents = new Set(typingAgents);
					}
				};

				// Helper function to use fallback message (UI-first, persistence best-effort)
				const useFallbackMessage = async (agent: AIAgent) => {
					const fallbackContent = generateFallbackMessage(agent, message).trim();
					if (!fallbackContent) {
						clearTyping(agent.id);
						return false;
					}

					await waitForAiDelay(2000 + Math.random() * 2000); // 2-4 seconds

					const fallbackClientTempId = `fallback-${agent.id}-${Date.now()}-${Math.random()
						.toString(36)
						.slice(2, 8)}`;
					const now = new Date();

					// UI-first: add to local state immediately
					discussionTimeline.upsert({
						key: `temp:${fallbackClientTempId}`,
						clientTempId: fallbackClientTempId,
						round: currentRound,
						senderType: 'ai',
						senderId: agent.id,
						senderRole: agent.role,
						senderName: agent.name,
						content: fallbackContent,
						createdAt: now.toISOString(),
						status: 'sent'
					});

					clearTyping(agent.id);

					// Best-effort persistence after UI update
					try {
						const fallbackTurnIndex = discussionTimeline.messages.filter(
							(msg) => msg.round === currentRound && msg.senderType === 'ai' && msg.senderId === agent.id
						).length;
						const persisted = await storeAIMessage(
							supabase,
							gameId,
							proposalId,
							currentRound,
							agent.id,
							agent.role,
							fallbackContent,
							{
								turnIndex: SINGLE_AI_MODE_ROUND7 ? fallbackTurnIndex : null,
								clientTempId: fallbackClientTempId
							}
						);
						if (persisted) {
							discussionTimeline.removeByClientTempId(fallbackClientTempId);
							discussionTimeline.upsert(
								timelineMessagesFromDbMessage({
									id: persisted.id,
									game_id: persisted.gameId,
									proposal_id: persisted.proposalId,
									round: persisted.round,
									participant_type: persisted.participantType,
									participant_id: persisted.participantId,
									agent_role: persisted.agentRole,
									content: persisted.content,
									created_at: persisted.createdAt,
									metadata: persisted.metadata
								})
							);
						}
					} catch (fallbackError) {
						console.error(`Failed to store fallback message for ${agent.name}:`, fallbackError);
					}

					return true;
				};

				// Calculate delay: 1 minute (60000ms) divided by number of agents, minimum 10 seconds (10000ms)
				const totalTime = 60000; // 1 minute in milliseconds
				const minDelay = 10000; // 10 seconds minimum
				const baseDelay = Math.max(minDelay, Math.floor(totalTime / aiAgents.length));
				
				// Shuffle agents for random order
				const shuffledAgents = [...aiAgents].sort(() => Math.random() - 0.5);
				
				// Process each agent sequentially
				for (let i = 0; i < shuffledAgents.length; i++) {
					const agent = shuffledAgents[i];

					// Small gap before showing next typing bubble
					if (i > 0) {
						await waitForAiDelay(200);
					}
					
					// Only show the current agent typing
					typingAgents = new Set([agent.id]);

					// Calculate random delay between minDelay and baseDelay * 1.5
					const delay = Math.floor(minDelay + Math.random() * (baseDelay * 1.5 - minDelay));
					
					// Wait before processing next agent (except for first agent)
					if (i > 0) {
						await waitForAiDelay(delay);
					}
					
					try {
						const inputSource = message.trim() ? 'manual' : 'auto';
						const allowMultipleAiReplies =
							chatRound &&
							MAX_AI_MESSAGES_ROUND7 > 1;

						// Generate message in backend first (respects rate limit)
						const response = await fetch('/api/ai/messages', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								gameId: gameId,
								proposalId: proposalId,
								round: currentRound,
								agentRole: agent.role,
								userId: data.userId,
								inputSource,
								allowMultipleAiReplies,
								chatHistory: chatHistory,
								latestUserMessage: message // Pass the most recent user message
							})
						});

						if (!response.ok) {
							if (response.status === 429 || response.status === 500) {
								await useFallbackMessage(agent);
							} else {
								clearTyping(agent.id);
							}
							continue;
						}

						const result = await response.json();
						if (result.success && result.message) {
							// Message was successfully generated - typing indicator already shown
							try {
								// Wait a bit before showing the actual message (simulate typing)
								await waitForAiDelay(2000 + Math.random() * 2000); // 2-4 seconds
								
								// Split content if it contains multiple messages (separated by \n\n)
								const messageContents = result.message.content
									.split('\n\n')
									.filter((m: string) => m.trim());
								
								messageContents.forEach((content: string, index: number) => {
									discussionTimeline.upsert({
										key: `db:${result.message.id}:${index}`,
										dbId: result.message.id,
										round: result.message.round,
										senderType: 'ai',
										senderId: agent.id,
										senderRole: agent.role,
										senderName: agent.name,
										content: content.trim(),
										createdAt: result.message.createdAt,
										status: 'sent'
									});
								});
							} finally {
								clearTyping(agent.id);
							}
						} else {
							clearTyping(agent.id);
						}
					} catch (error) {
						// On unexpected errors, attempt fallback to keep UI responsive
						console.error(`AI message generation failed for ${agent.name}:`, error);
						await useFallbackMessage(agent);
					}
				}
			}
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			if (chatRound) {
				userIsSending = false;
			}
		}
	}

	function handleOpenHistory() {
		openHistoryDialog = true;
	}

	// Generate fallback message when API rate limit is reached
	function generateFallbackMessage(agent: AIAgent, userMessage: string): string {
		const roleMessages: Record<Role, string[]> = {
			administration: [
				'From an administrative perspective, we need to consider the practical implementation of this proposal.',
				'We should evaluate the organizational impact and resource requirements carefully.',
				'Administrative efficiency is crucial for successful implementation.'
			],
			research: [
				'Research indicates that this approach has potential benefits worth exploring.',
				'We need more data to fully understand the long-term implications.',
				'From a research standpoint, this requires further investigation and validation.'
			],
			reception: [
				'This would impact how we interact with visitors and stakeholders.',
				'We should consider the user experience implications carefully.',
				'Reception services would need to adapt to ensure smooth visitor experience.'
			],
			operations: [
				'Operational feasibility is a key concern that needs careful assessment.',
				'We need to evaluate the day-to-day implementation challenges.',
				'Operations would need to be restructured to accommodate this change effectively.'
			],
			bar: [
				'This could affect our service delivery model and customer satisfaction.',
				'We should consider the customer-facing aspects of this proposal.',
				'Service quality must be maintained throughout any transition.'
			],
			cleaning: [
				'Maintenance and sustainability are important factors to consider.',
				'We need to ensure this doesn\'t create additional workload or complexity.',
				'From a maintenance perspective, this requires careful planning and resource allocation.'
			]
		};

		const messages = roleMessages[agent.role] || roleMessages.administration;
		const randomMessage = messages[Math.floor(Math.random() * messages.length)];
		
		// Add context about the user's message if available
		if (userMessage && userMessage.trim().length > 0) {
			const fallbackMsg = `${randomMessage} Regarding your point about "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}", ${agent.name} agrees this is worth discussing.`;
			console.log(`Generated fallback message for ${agent.name} with user context:`, fallbackMsg);
			return fallbackMsg;
		}
		
		const fallbackMsg = `${randomMessage} ${agent.name} believes this is an important topic for discussion.`;
		console.log(`Generated fallback message for ${agent.name} without user context:`, fallbackMsg);
		return fallbackMsg;
	}

	async function handleLeaveGame() {
		const confirmed = confirm(m.confirm_leave_discussion());

		if (confirmed) {
			const success = await gameState.markPlayerInactive();
			if (!success) {
				alert(m.leave_discussion_failed());
			}
			goto('/');
		}
	}
	$inspect(gameState.currentRound);
	$inspect(playerState);
</script>

	<div class="w-screen h-[100dvh] relative">
		<Map layout={aquariumLayout} />
		<RoundIndicator rounds={gameState.rounds} currentRound={gameState.currentRound} />
		<StatusPill
			playerState={currentPlayerState}
			currentRound={gameState.currentRound}
		/>
	<ProposalDialog 
		bind:open={openProposalDialog} 
		proposalId={data.proposalId ?? null} 
	/>
	
	{#if !chatRound}
		<div class="discussion-entry-controls fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[520px] z-50 pointer-events-auto flex flex-col gap-3">
			<Button
				size="lg"
				onclick={async () => {
					openStoryDialog = true;
					keepStoryDialogOpen = true;
					if (gameState.currentRound > 0) {
						gameState.playerMove();
					}
				}}
				class="story-button rounded-full px-4"
				disabled={!tourCompleted}
			>
				<ScrollText />
				{m.story_sheet()}
			</Button>
			<button
				type="button"
				class="tour-proposal-button w-full rounded-full border-2 border-sand bg-white px-4 py-3 text-center text-base font-semibold text-black shadow-lg transition-colors hover:bg-sand/20"
				disabled={!tourCompleted}
				onclick={() => (openProposalDialog = true)}
			>
				<FileText class="mr-2 inline-block h-4 w-4" />
				{m.view_full_proposal()}
			</button>
		</div>
	{/if}

	{#if showLayoutDebug}
		<div
			class="fixed left-3 right-3 z-[90] pointer-events-none border-2 border-dashed border-fuchsia-500/70 rounded-2xl bg-fuchsia-500/5"
			style={`top:${aquariumLayout.safeTopPx}px; bottom:${aquariumLayout.safeBottomPx}px;`}
		></div>
		<div class="fixed left-3 bottom-3 z-[91] rounded-lg bg-black/80 px-3 py-2 text-xs text-white pointer-events-none">
			safeTop: {Math.round(aquariumLayout.safeTopPx)}px · safeBottom:{' '}
			{Math.round(aquariumLayout.safeBottomPx)}px
		</div>
	{/if}
	<div
		class="fixed avatar-boundary left-3 right-3 z-[60] pointer-events-none rounded-2xl"
		style={`top:${aquariumLayout.safeTopPx}px; bottom:${aquariumLayout.safeBottomPx}px;`}
		aria-hidden="true"
	></div>
	<StoryDialog bind:open={openStoryDialog} {gameState} proposalId={data.proposalId ?? null} />
	
	<!-- Discussion Input: Button for rounds 1-6, Input Bar for round 7 -->
	{#if enableDiscussionChat && chatRound}
		{#if gameState.mode === 'pedagogic'}
			<div class="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[560px] z-50 pointer-events-auto">
				<div class="bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-black/5">
					<Timer onTimeUp={() => {}} duration={gameState.getTimerDurationForRound(gameState.currentRound)} />
				</div>
			</div>
		{/if}
		<div class="discussion-controls fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[760px] z-50 pointer-events-auto flex flex-col gap-3">
			<!-- Discussion Input Bar (Round 7 only) -->
			<DiscussionInputBar
				inline
				onSend={handleSendMessage}
				onOpenHistory={handleOpenHistory}
				onDraftChange={(draft) => (userDraft = draft)}
				gameId={data.game.id}
				proposalId={data.proposalId ?? null}
				round={gameState.currentRound}
				userId={data.userId}
				disabled={!tourCompleted}
			/>
			<button
				type="button"
				class="tour-proposal-button w-full rounded-full border-2 border-sand bg-white px-4 py-3 text-center text-base font-semibold text-black shadow-lg transition-colors hover:bg-sand/20"
				disabled={!tourCompleted}
				onclick={() => (openProposalDialog = true)}
			>
				<FileText class="mr-2 inline-block h-4 w-4" />
				{m.view_full_proposal()}
			</button>
		</div>
	{/if}
	
	<!-- Discussion History Dialog -->
	{#if enableDiscussionChat && chatRound}
		<DiscussionHistoryDialog
			bind:open={openHistoryDialog}
			messages={discussionMessages}
			onClose={() => (openHistoryDialog = false)}
		/>
	{/if}
	<Button
		size="default"
		onclick={() => (openHelpDialog = true)}
		class="absolute top-4 left-4 help-button z-50 pointer-events-auto"
		disabled={!tourCompleted}
	>
		{m.help()}
		<CircleHelp />
	</Button>
	<HelpDialog bind:open={openHelpDialog} />
	<Button
		variant="default"
		size="default"
		class="absolute top-4 right-4 exit-button z-50 pointer-events-auto"
		onclick={handleLeaveGame}
		disabled={!tourCompleted}
	>
		{m.exit()} <LogOut size={16} />
	</Button>
	<!-- Participants (Humans + AI Agents) positioned around aquarium -->
	<ParticipantsContainer
		participants={participants}
		playersState={gameState.playersState}
		aiMessages={chatRound && hasUserChattedThisRound ? aiMessages : []}
		currentRound={gameState.currentRound}
		{tourCompleted}
		{transitionState}
		currentPlayerId={data.playerId}
		typingAgents={chatRound && hasUserChattedThisRound ? typingAgents : new Set()}
		userChatIsTyping={chatRound ? userIsTyping : false}
		userChatDraft={chatRound ? userDraft : ''}
		userChatMessage={chatRound ? userLastSentMessage : null}
		userChatIsSending={chatRound ? userIsSending : false}
		layout={aquariumLayout}
	/>

	{#if showRoundTransition}
		<RoundTransition
			round={gameState.currentRound}
			onComplete={handleTransitionComplete}
			bind:transitionState
		/>
	{/if}

	<EndDialog
		bind:open={openEndDialog}
		{gameState}
		{discussionMessages}
		proposalId={data.proposalId ?? null}
	/>
</div>
