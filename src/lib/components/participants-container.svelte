<script lang="ts">
	import type { Participant, PlayerState, AIMessage } from '@/types';
	import PlayerBadge from './player-badge.svelte';
	import AIAgent from './ai-agent.svelte';
	import { calculateAquariumPositions } from '@/utils/participants';
	import { onMount } from 'svelte';
	import type { AquariumLayoutState } from '@/state/aquarium-layout.svelte';

	interface ParticipantsContainerProps {
		participants: Participant[];
		playersState?: Record<number, PlayerState>;
		aiMessages?: AIMessage[];
		currentRound: number;
		tourCompleted: boolean;
		transitionState: 'starting' | 'transitioning' | 'ending' | 'ended';
		currentPlayerId?: number;
		typingAgents?: Set<string>;
		userChatIsTyping?: boolean;
		userChatDraft?: string;
		userChatMessage?: string | null;
		userChatIsSending?: boolean;
		layout: AquariumLayoutState;
	}

	let {
		participants,
		playersState = {},
		aiMessages = [],
		currentRound,
		tourCompleted,
		transitionState,
		currentPlayerId,
		typingAgents = new Set(),
		userChatIsTyping = false,
		userChatDraft = '',
		userChatMessage = null,
		userChatIsSending = false,
		layout
	}: ParticipantsContainerProps = $props();

	let viewportWidth = $state(1024);
	let viewportHeight = $state(768);
	let containerEl: HTMLDivElement | null = null;

	function recomputeBadgeSize() {
		if (!containerEl || typeof window === 'undefined') return;
		const els = Array.from(
			containerEl.querySelectorAll<HTMLElement>('[data-badge-core]')
		);
		if (els.length === 0) return;

		let maxW = 0;
		let maxH = 0;
		for (const el of els) {
			const rect = el.getBoundingClientRect();
			if (rect.width > maxW) maxW = rect.width;
			if (rect.height > maxH) maxH = rect.height;
		}

		// Avoid thrashing state for tiny subpixel changes.
		const nextW = Math.round(maxW);
		const nextH = Math.round(maxH);
		if (nextW > 0 && nextH > 0) {
			layout.setBadgeSize(nextW, nextH);
		}
	}

	onMount(() => {
		const updateViewport = () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
			recomputeBadgeSize();
		};

		updateViewport();
		window.addEventListener('resize', updateViewport);

		return () => window.removeEventListener('resize', updateViewport);
	});

	$effect(() => {
		// Remeasure when the set of badges or their content changes.
		participants.length;
		currentRound;
		aiMessages.length;
		transitionState;
		requestAnimationFrame(recomputeBadgeSize);
	});

	// Find index of current player in participants array
	const currentPlayerIndex = $derived.by(() => {
		if (currentPlayerId === undefined) {
			const firstHuman = participants.findIndex(p => p.type === 'human');
			return firstHuman >= 0 ? firstHuman : 0;
		}
		const idx = participants.findIndex(
			p => p.type === 'human' && p.player.id === currentPlayerId
		);
		if (idx >= 0) return idx;
		const fallbackHuman = participants.findIndex(p => p.type === 'human');
		return fallbackHuman >= 0 ? fallbackHuman : 0;
	});

	const layoutWidth = $derived.by(() =>
		viewportWidth
	);
	const layoutHeight = $derived.by(() =>
		viewportHeight
	);
	const tableRect = $derived.by(() => {
		if (layout.tableWidth <= 0 || layout.tableHeight <= 0) return null;
		return {
			x: layout.tableLeft,
			y: layout.tableTop,
			width: layout.tableWidth,
			height: layout.tableHeight
		};
	});
	const clampRect = $derived.by(() => {
		if (layout.containerWidth <= 0 || layout.containerHeight <= 0) return null;
		return {
			left: layout.containerLeft,
			top: layout.containerTop,
			width: layout.containerWidth,
			height: layout.containerHeight
		};
	});
	const badgeSize = $derived.by(() => {
		if (layout.badgeWidth <= 0 || layout.badgeHeight <= 0) return null;
		return { width: layout.badgeWidth, height: layout.badgeHeight };
	});

	const positions = $derived(
		calculateAquariumPositions(
			participants.length, 
			currentPlayerIndex >= 0 ? currentPlayerIndex : 0,
			layoutWidth,
			layoutHeight,
			layout.safeTopPx,
			layout.safeBottomPx,
			0,
			0,
			tableRect,
			clampRect,
			badgeSize
		)
	);
</script>

<!-- Participants positioned around aquarium table (centered on screen) -->
<div class="fixed inset-0 w-screen h-screen z-10 overflow-visible">
	<div bind:this={containerEl} class="relative w-full h-full overflow-visible pointer-events-none">
		{#each participants as participant, index}
			{@const position = positions[index]}
			{@const inlineStyle = `left: ${position.xPx}px; top: ${position.yPx}px; transform: translate(-50%, -50%);`}
			
			{@const isCurrent = participant.type === 'human' && participant.player.id === currentPlayerId}
			{@const angleRad = (position.angle * Math.PI) / 180}
			{@const cos = Math.cos(angleRad)}
			{@const bubbleSide = isCurrent
				? 'right'
				: cos > 0.25
					? 'left'
					: cos < -0.25
						? 'right'
						: 'right'}
			<div class="absolute z-20 overflow-visible pointer-events-auto" style="{inlineStyle}">
				{#if participant.type === 'human'}
					{@const isCurrent = participant.player.id === currentPlayerId}
					<PlayerBadge
						player={participant.player}
						playerState={playersState[participant.player.id] || { state: 'done' }}
						round={currentRound}
						currentRound={currentRound}
						{tourCompleted}
						{transitionState}
						isCurrentPlayer={participant.player.id === currentPlayerId}
						bubbleSide={bubbleSide}
					/>
				{:else}
					{@const agentMessages = aiMessages.filter(msg => msg.agent_id === participant.agent.id)}
					<AIAgent
						agent={participant.agent}
						messages={agentMessages}
						round={currentRound}
						isActive={agentMessages.some(msg => msg.round === currentRound)}
						isTyping={typingAgents.has(participant.agent.id)}
						bubbleSide={bubbleSide}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div>
