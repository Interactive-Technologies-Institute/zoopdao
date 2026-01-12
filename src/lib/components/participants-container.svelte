<script lang="ts">
	import type { Participant, PlayerState, AIMessage } from '@/types';
	import PlayerBadge from './player-badge.svelte';
	import AIAgent from './ai-agent.svelte';
	import { calculateAquariumPositions } from '@/utils/participants';

	interface ParticipantsContainerProps {
		participants: Participant[];
		playersState?: Record<number, PlayerState>;
		aiMessages?: AIMessage[];
		currentRound: number;
		tourCompleted: boolean;
		transitionState: 'starting' | 'transitioning' | 'ending' | 'ended';
		currentPlayerId?: number;
		typingAgents?: Set<string>;
	}

	let {
		participants,
		playersState = {},
		aiMessages = [],
		currentRound,
		tourCompleted,
		transitionState,
		currentPlayerId,
		typingAgents = new Set()
	}: ParticipantsContainerProps = $props();

	// Find index of current player in participants array
	const currentPlayerIndex = $derived.by(() => {
		if (currentPlayerId === undefined) return 0;
		return participants.findIndex(p => 
			p.type === 'human' && p.player.id === currentPlayerId
		);
	});

	const positions = $derived(
		calculateAquariumPositions(
			participants.length, 
			currentPlayerIndex >= 0 ? currentPlayerIndex : 0
		)
	);
</script>

<!-- Participants positioned around aquarium table (centered on screen) -->
<div class="fixed inset-0 w-screen h-screen z-10 overflow-visible">
	<div class="relative w-full h-full overflow-visible pointer-events-none">
		{#each participants as participant, index}
			{@const position = positions[index]}
			{@const inlineStyle = `left: ${position.xVw}vw; top: ${position.yVh}vh; transform: translate(-50%, -50%);`}
			
			<div class="absolute z-20 overflow-visible pointer-events-auto" style="{inlineStyle}">
				{#if participant.type === 'human'}
					<PlayerBadge
						player={participant.player}
						playerState={playersState[participant.player.id] || { state: 'done' }}
						round={currentRound}
						currentRound={currentRound}
						{tourCompleted}
						{transitionState}
						isCurrentPlayer={participant.player.id === currentPlayerId}
					/>
				{:else}
					{@const agentMessages = aiMessages.filter(msg => msg.agent_id === participant.agent.id)}
					<AIAgent
						agent={participant.agent}
						messages={agentMessages}
						round={currentRound}
						isActive={agentMessages.some(msg => msg.round === currentRound)}
						isTyping={typingAgents.has(participant.agent.id)}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div>

