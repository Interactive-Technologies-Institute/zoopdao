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
	import { MapPosition } from '@/state/map-position.svelte';
	import { CircleHelp, ScrollText, LogOut, Image } from 'lucide-svelte';
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
	import IslandDialog from '@/components/island-dialog.svelte';
	import { calculateAIAgentsCount, generateAIAgents, createParticipants } from '@/utils/participants';
	import { generateAIMessages } from '@/utils/ai-messages';
	import type { AIAgent, AIMessage, Participant } from '@/types';
	import { supabase } from '@/supabase';
	import { storeHumanMessage, getDiscussionMessages, getChatHistoryForAI } from '@/utils/discussion-messages';

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
		data.stops,
		data.cards,
		data.rounds,
		data.game,
		data.gameRounds,
		data.playerId,
		data.players,
		data.playerMoves,
		data.playerCards,
		data.playerAnswers
	);

	let mapPosition = new MapPosition();

	let showRoundTransition = $state(false);
	type TransitionState = 'starting' | 'transitioning' | 'ending' | 'ended';
	let transitionState: TransitionState = $state('starting');
	let previousRound = $state(0);
	
	// AI Agents and Participants
	let aiAgents = $state<AIAgent[]>([]);
	let aiMessages = $state<AIMessage[]>([]);
	let typingAgents = $state<Set<string>>(new Set()); // Track which agents are currently typing
	
	// Initialize AI agents based on human players count
	$effect(() => {
		const humanPlayers = gameState.players.filter(p => p.is_active !== false);
		if (humanPlayers.length > 0 && aiAgents.length === 0) {
			try {
				const aiCount = calculateAIAgentsCount(humanPlayers.length);
				const humanRoles = humanPlayers.map(p => p.role).filter((r): r is string => r !== null) as any[];
				aiAgents = generateAIAgents(aiCount, humanRoles);
			} catch (error) {
				console.error('Error initializing AI agents:', error);
			}
		}
	});
	
	// Create participants list (humans + AI)
	const participants = $derived.by(() => {
		const humanPlayers = gameState.players.filter(p => p.is_active !== false);
		return createParticipants(humanPlayers, aiAgents);
	});
	
	// Generate AI messages after each round completion
	$effect(() => {
		if (gameState.currentRound > 0 && gameState.currentRound <= 7 && aiAgents.length > 0) {
			// Check if messages for this round already exist
			const existingMessagesForRound = aiMessages.filter(msg => msg.round === gameState.currentRound);
			if (existingMessagesForRound.length === 0) {
				// Generate messages for current round
				const newMessages = generateAIMessages(aiAgents, gameState.currentRound);
				aiMessages = [...aiMessages, ...newMessages];
			}
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

	function handleTransitionComplete() {
		showRoundTransition = false;
	}

	let playerState = $derived.by(() => {
		return gameState.playersState[gameState.playerId].state;
	});

	let currentPlayerState = $derived.by(() => {
		return gameState.playersState[gameState.playerId] || { state: 'done' };
	});

	let openStoryDialog = $state(false);
	let openHelpDialog = $state(false);
	let openEndDialog = $state(false);
	let openIslandDialog = $state(false);
	let openHistoryDialog = $state(false);
	
	// Discussion messages state
	interface DiscussionMessage {
		id: string;
		content: string;
		senderType: 'human' | 'ai';
		senderName: string;
		round: number;
		timestamp: Date;
	}
	let discussionMessages = $state<DiscussionMessage[]>([]);

	// Load existing messages on mount
	$effect(() => {
		if (gameState.state === 'playing' || gameState.state === 'finished') {
			const loadMessages = async () => {
				try {
					const gameId = data.game.id;
					const messages = await getDiscussionMessages(supabase, gameId);
					
					discussionMessages = messages.map((msg) => ({
						id: msg.id.toString(),
						content: msg.content,
						senderType: msg.participantType === 'human' ? 'human' : 'ai',
						senderName: msg.participantType === 'human' 
							? 'You' 
							: (msg.agentRole ? msg.agentRole.charAt(0).toUpperCase() + msg.agentRole.slice(1) : 'AI Agent'),
						round: msg.round,
						timestamp: new Date(msg.createdAt)
					}));
				} catch (error) {
					console.error('Error loading messages:', error);
				}
			};
			loadMessages();
		}
	});

	

	$effect(() => {
		if (gameState.state === 'starting') {
			startupAudio.play();
		}
	});

	$effect(() => {
		if (gameState.state === 'finished') {
			fanfareAudio?.play();
			openEndDialog = true;
		}
	});

	async function handleSendMessage(message: string) {
		try {
			const gameId = data.game.id;
			const proposalId = (data.game as any).proposal_id || null; // Get proposal_id if exists
			const currentRound = gameState.currentRound;
			const playerId = data.playerId;

			// Save human message to database
			const savedMessage = await storeHumanMessage(
				supabase,
				gameId,
				proposalId,
				currentRound,
				playerId,
				message
			);

			if (!savedMessage) {
				console.error('Failed to save message');
				return;
			}

			// Add human message to local state
			const newMessage: DiscussionMessage = {
				id: savedMessage.id.toString(),
				content: savedMessage.content,
				senderType: 'human',
				senderName: 'You',
				round: savedMessage.round,
				timestamp: new Date(savedMessage.createdAt)
			};
			discussionMessages = [...discussionMessages, newMessage];

			// Get chat history for AI context (including current round)
			const chatHistory = await getChatHistoryForAI(supabase, gameId, currentRound); // Includes current round messages

			// Generate AI agent responses sequentially with delays
			if (aiAgents.length > 0) {
				// Calculate delay: 1 minute (60000ms) divided by number of agents, minimum 10 seconds (10000ms)
				const totalTime = 60000; // 1 minute in milliseconds
				const minDelay = 10000; // 10 seconds minimum
				const baseDelay = Math.max(minDelay, Math.floor(totalTime / aiAgents.length));
				
				// Shuffle agents for random order
				const shuffledAgents = [...aiAgents].sort(() => Math.random() - 0.5);
				
				// Process each agent sequentially
				for (let i = 0; i < shuffledAgents.length; i++) {
					const agent = shuffledAgents[i];
					
					// Calculate random delay between minDelay and baseDelay * 1.5
					const delay = Math.floor(minDelay + Math.random() * (baseDelay * 1.5 - minDelay));
					
					// Wait before processing next agent (except for first agent)
					if (i > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					
					try {
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
								chatHistory: chatHistory,
								latestUserMessage: message // Pass the most recent user message
							})
						});

						if (!response.ok) {
							const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
							const errorMessage = errorData.error || `Failed to generate message for ${agent.name}`;
							const retryAfter = errorData.retryAfter;
							console.error(`Failed to generate message for ${agent.name}:`, errorMessage);
							
							// Don't show typing indicator if rate limit or error
							// Show user-friendly error message for 503/429 errors
							if (response.status === 503 || response.status === 429) {
								const message = retryAfter 
									? `${errorMessage} (Wait ${retryAfter} seconds)`
									: errorMessage;
								alert(message);
							}
							continue;
						}

						const result = await response.json();
						if (result.success && result.message) {
							// Message was successfully generated - now show typing indicator
							typingAgents = new Set([...typingAgents, agent.id]);
							
							// Wait a bit before showing the actual message (simulate typing)
							await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // 2-4 seconds
							
							// Remove typing indicator and show message
							typingAgents.delete(agent.id);
							typingAgents = new Set(typingAgents);
							
							// Split content if it contains multiple messages (separated by \n\n)
							const messageContents = result.message.content.split('\n\n').filter(m => m.trim());
							
							messageContents.forEach((content, index) => {
								// Add to discussionMessages for chat history
								const discussionMessage: DiscussionMessage = {
									id: `${result.message.id}-${index}`,
									content: content.trim(),
									senderType: 'ai',
									senderName: agent.name,
									round: result.message.round,
									timestamp: new Date(result.message.createdAt)
								};
								discussionMessages = [...discussionMessages, discussionMessage];
								
								// Add to aiMessages for display in participants container
								const aiMessage: AIMessage = {
									id: `${result.message.id}-${index}`,
									agent_id: agent.id,
									round: result.message.round,
									content: content.trim(),
									created_at: result.message.createdAt
								};
								console.log('Adding AI message:', { agent: agent.name, message: aiMessage, currentRound });
								aiMessages = [...aiMessages, aiMessage];
							});
						}
					} catch (error) {
						console.error(`Error generating message for ${agent.name}:`, error);
						const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI message';
						
						// Don't show typing indicator on error
						alert(`Error: ${errorMessage}`);
					}
				}
			}
		} catch (error) {
			console.error('Error sending message:', error);
			alert('Failed to send message. Please try again.');
		}
	}

	function handleOpenHistory() {
		openHistoryDialog = true;
	}

	async function handleLeaveGame() {
		const confirmed = confirm('Are you sure you want to leave the game?');

		if (confirmed) {
			const success = await gameState.markPlayerInactive();
			if (success) {
				goto('/');
			} else {
				alert('Failed to leave game. Please try again.');
			}
		}
	}
	$inspect(gameState.currentRound);
	$inspect(playerState);
</script>

<!-- <svelte:window
	onkeydown={(e) => mapPosition.pan(e)}
	onwheel={(e) => mapPosition.zoom(e)}
	onmousedown={(e) => mapPosition.startDrag(e)}
	onmousemove={(e) => mapPosition.drag(e)}
	onmouseup={() => mapPosition.endDrag()}
	onmouseleave={() => mapPosition.endDrag()}
	ontouchstart={(e) => mapPosition.startDrag(e)}
	ontouchmove={(e) => mapPosition.drag(e)}
	ontouchend={() => mapPosition.endDrag()}
/> -->

<div class="w-screen h-[100dvh] relative">
	<Map {gameState} position={mapPosition} {tourCompleted} />
	<RoundIndicator rounds={gameState.rounds} currentRound={gameState.currentRound} />
	<StatusPill
		playerState={currentPlayerState}
		currentRound={gameState.currentRound}
	/>
	<Button
		size="icon-lg"
		class="absolute right-4 -translate-y-1/2 top-1/2 images z-50 pointer-events-auto"
		disabled={!tourCompleted}
		onclick={() => (openIslandDialog = true)}
	>
		<Image />
	</Button>
	<IslandDialog bind:open={openIslandDialog} />
	
		<Button
			size="lg"
			onclick={async () => {
				// For round 0, playerStart requires stop_id (handled by map click)
				// For round 7, call playerStart without stop_id
				openStoryDialog = true;
				if (gameState.state === 'starting') {
					gameState.playerStart();
				} else if (gameState.state === 'playing') {
					gameState.playerMove();
			}}}
			class="absolute bottom-4 left-1/2 -translate-x-1/2 story-button rounded-full px-4 z-50 pointer-events-auto"
			disabled={!tourCompleted}
		>
			<ScrollText />
			{m.story_sheet()}
		</Button>
	<StoryDialog bind:open={openStoryDialog} {gameState} />
	
	<!-- Discussion Input: Button for rounds 1-6, Input Bar for round 7 -->
	{#if gameState.currentRound === 7}
		<!-- Discussion Input Bar (Round 7 only) -->
		<DiscussionInputBar
			onSend={handleSendMessage}
			onOpenHistory={handleOpenHistory}
			disabled={!tourCompleted}
		/>
	{:else if gameState.currentRound > 0 && gameState.currentRound < 7}
		<!-- Discussion Input Button (Rounds 1-6) - Centered at bottom -->
		<div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(900px,calc(100vw-2rem))] z-50 pointer-events-auto">
			<div class="relative">
				<!-- Background bar with shadow matching input bar style -->
				<div class="bg-gradient-to-b from-[#3a3a3a] to-[#2f2f2f] rounded-full px-6 py-5 shadow-2xl border border-white/10">
					<Button
						size="lg"
						onclick={async () => {
							// Call playerStart first to set state to 'writing' (like clicking on map)
							await gameState.playerMove();
							// Wait a bit for state to update, then open dialog
							await new Promise(resolve => setTimeout(resolve, 100));
							openStoryDialog = true;
							
							// Timer will be started automatically by StoryDialog when it opens
						}}
						class="w-full rounded-full px-6 py-3 bg-dark-green hover:bg-dark-green/90 text-white font-semibold pointer-events-auto"
						disabled={!tourCompleted}
					>
						<ScrollText />
						{m.story_sheet()}
					</Button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Discussion History Dialog -->
	<DiscussionHistoryDialog
		bind:open={openHistoryDialog}
		gameId={data.game.id}
		supabase={supabase}
		onClose={() => (openHistoryDialog = false)}
	/>
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
		Exit <LogOut size={16} />
	</Button>
	<!-- Participants (Humans + AI Agents) positioned around aquarium -->
	<ParticipantsContainer
		participants={participants}
		playersState={gameState.playersState}
		{aiMessages}
		currentRound={gameState.currentRound}
		{tourCompleted}
		{transitionState}
		currentPlayerId={data.playerId}
		{typingAgents}
	/>

	{#if showRoundTransition}
		<RoundTransition
			round={gameState.currentRound}
			onComplete={handleTransitionComplete}
			bind:transitionState
		/>
	{/if}

	<EndDialog bind:open={openEndDialog} {gameState} />
</div>
