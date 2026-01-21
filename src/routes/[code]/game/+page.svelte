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
	import { storeHumanMessage, getDiscussionMessages, getChatHistoryForAI, storeAIMessage } from '@/utils/discussion-messages';

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

	let mapPosition = new MapPosition();

	let showRoundTransition = $state(false);
	type TransitionState = 'starting' | 'transitioning' | 'ending' | 'ended';
	let transitionState: TransitionState = $state('starting');
	let previousRound = $state(0);
	
	const enableDiscussionChat = true;
	const chatRound = $derived.by(() => gameState.currentRound === 7);
	
	// Configurable variable for number of discussion rounds with message exchanges
	// This controls how many rounds of messages are exchanged between user and AIs
	// before showing the save history popup
	const DISCUSSION_ROUNDS_COUNT = 1; // Can be changed to allow more rounds of discussion
	
	let hasUserChattedThisRound = $state(false);
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
			// Reset discussion round count when entering a new round
			discussionRoundCount = 0;
		}
	});

	$effect(() => {
		if (!enableDiscussionChat || !chatRound || !hasUserChattedThisRound) {
			aiMessages = [];
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
	let openProposalDialog = $state(false);
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
		if (!enableDiscussionChat || !chatRound || !hasUserChattedThisRound) {
			discussionMessages = [];
			return;
		}
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
			
			// If all agents have responded and none are typing, discussion round is complete
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
			}
			const gameId = data.game.id;
			const proposalId = data.proposalId || null; // Get proposal_id from loader
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

					await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // 2-4 seconds

					const localId = `fallback-${agent.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
					const now = new Date();

					// UI-first: add to local state immediately
					const discussionMessage: DiscussionMessage = {
						id: localId,
						content: fallbackContent,
						senderType: 'ai',
						senderName: agent.name,
						round: currentRound,
						timestamp: now
					};
					discussionMessages = [...discussionMessages, discussionMessage];

					const aiMessage: AIMessage = {
						id: localId,
						agent_id: agent.id,
						round: currentRound,
						content: fallbackContent,
						created_at: now.toISOString()
					};
					aiMessages = [...aiMessages, aiMessage];

					clearTyping(agent.id);

					// Best-effort persistence after UI update
					try {
						await storeAIMessage(
							supabase,
							gameId,
							proposalId,
							currentRound,
							agent.id,
							agent.role,
							fallbackContent
						);
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
						await new Promise(resolve => setTimeout(resolve, 200));
					}
					
					// Only show the current agent typing
					typingAgents = new Set([agent.id]);

					// Calculate random delay between minDelay and baseDelay * 1.5
					const delay = Math.floor(minDelay + Math.random() * (baseDelay * 1.5 - minDelay));
					
					// Wait before processing next agent (except for first agent)
					if (i > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					
					try {
						const inputSource = message.trim() ? 'manual' : 'auto';

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
								await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // 2-4 seconds
								
								// Split content if it contains multiple messages (separated by \n\n)
								const messageContents = result.message.content
									.split('\n\n')
									.filter((m: string) => m.trim());
								
								messageContents.forEach((content: string, index: number) => {
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
		size="lg"
		class="absolute right-4 -translate-y-1/2 top-1/2 images z-50 pointer-events-auto"
		disabled={!tourCompleted}
		onclick={() => (openProposalDialog = true)}
	>
		<FileText />
		{m.view_full_proposal()}
	</Button>
	<ProposalDialog 
		bind:open={openProposalDialog} 
		proposalId={data.proposalId ?? null} 
	/>
	
	<Button
		size="lg"
			onclick={async () => {
				openStoryDialog = true;
				if (gameState.currentRound > 0) {
					gameState.playerMove();
				}
			}}
			class="absolute bottom-4 left-1/2 -translate-x-1/2 story-button rounded-full px-4 z-50 pointer-events-auto"
		disabled={!tourCompleted}
	>
		<ScrollText />
		{m.story_sheet()}
	</Button>
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
		<!-- Discussion Input Bar (Round 7 only) -->
		<DiscussionInputBar
			onSend={handleSendMessage}
			onOpenHistory={handleOpenHistory}
			gameId={data.game.id}
			proposalId={data.proposalId ?? null}
			round={gameState.currentRound}
			disabled={!tourCompleted}
		/>
	{/if}
	
	<!-- Discussion History Dialog -->
	{#if enableDiscussionChat && chatRound}
		<DiscussionHistoryDialog
			bind:open={openHistoryDialog}
			gameId={data.game.id}
			supabase={supabase}
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
