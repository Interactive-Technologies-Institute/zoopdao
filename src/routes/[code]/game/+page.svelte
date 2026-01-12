<script lang="ts">
	import Dice from '@/components/dice.svelte';
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

	let tour: Tour | undefined;

	let fanfareAudio: HTMLAudioElement;
	let startupAudio: HTMLAudioElement;

	let tourCompleted = $state(false);

	onMount(() => {
		fanfareAudio = new Audio(fanfare);
		fanfareAudio.volume = 0.;
		startupAudio = new Audio(bubbles);
		startupAudio.volume = 0.0;

		if (gameState.state === 'starting') {
			tour = createGameTour();
			tour.on('complete', () => {
				tourCompleted = true;
			});
			tour.on('cancel', () => {
				tourCompleted = true;
			});
			tour.start();
		} else {
			if (tour) {
				tour.complete();
				tour.cancel();
			}
			tour = undefined;
			tourCompleted = true;
		}
	});

	onDestroy(() => {
		if (tour) {
			tour.complete();
			tour.cancel();
		}
		gameState.cleanup();
	});

	let { data }: { data: PageData } = $props();

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

	let dice = $derived.by(() => {
		const currentRound = gameState.gameRounds.find(
			(round) => round.round === gameState.currentRound
		);
		return currentRound?.dice_roll || 5;
	});
	let playerState = $derived.by(() => {
		return gameState.playersState[gameState.playerId].state;
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

	$effect(() => {
		if (playerState === 'writing') {
			openStoryDialog = true;
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

	function handleSendMessage(message: string) {
		// Add human message to discussion
		const newMessage: DiscussionMessage = {
			id: crypto.randomUUID(),
			content: message,
			senderType: 'human',
			senderName: 'You',
			round: gameState.currentRound,
			timestamp: new Date()
		};
		discussionMessages = [...discussionMessages, newMessage];
		
		// TODO: Save to database
		console.log('Message sent:', message);
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
		playerState={gameState.playersState[gameState.playerId]}
		currentRound={gameState.currentRound}
	/>
	<Button
		size="icon-lg"
		class="absolute right-4 -translate-y-1/2 top-1/2 images"
		disabled={!tourCompleted}
		onclick={() => (openIslandDialog = true)}
	>
		<Image />
	</Button>
	<IslandDialog bind:open={openIslandDialog} />
	
	<!-- Story Sheet Button (Right Side) -->
	<Button
		size="lg"
		onclick={() => (openStoryDialog = true)}
		class="absolute bottom-4 right-4 story-button rounded-full px-4"
		disabled={!tourCompleted}
	>
		<ScrollText />
		{m.story_sheet()}
	</Button>
	<StoryDialog bind:open={openStoryDialog} {gameState} />
	
	<!-- Discussion Input Bar -->
	<DiscussionInputBar
		onSend={handleSendMessage}
		onOpenHistory={handleOpenHistory}
		disabled={!tourCompleted}
	/>
	
	<!-- Discussion History Dialog -->
	<DiscussionHistoryDialog
		bind:open={openHistoryDialog}
		messages={discussionMessages}
		onClose={() => (openHistoryDialog = false)}
	/>
	<Button
		size="default"
		onclick={() => (openHelpDialog = true)}
		class="absolute top-4 left-4 help-button"
		disabled={!tourCompleted}
	>
		{m.help()}
		<CircleHelp />
	</Button>
	<HelpDialog bind:open={openHelpDialog} />
	<Button
		variant="default"
		size="default"
		class="absolute top-4 right-4 exit-button"
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
	/>
	<div class="absolute left-4 bottom-4">
		{#if dice}
			<Dice value={dice} round={gameState.currentRound} {transitionState} />
		{/if}
	</div>

	{#if showRoundTransition}
		<RoundTransition
			round={gameState.currentRound}
			onComplete={handleTransitionComplete}
			bind:transitionState
		/>
	{/if}

	<EndDialog bind:open={openEndDialog} {gameState} />
</div>
