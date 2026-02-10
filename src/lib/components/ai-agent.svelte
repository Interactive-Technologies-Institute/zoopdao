<script lang="ts">
	import type { AIAgent, AIMessage } from '@/types';
	import { Bot } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ChatCircleHover from './chat-circle-hover.svelte';
	import { getAINonHumanCargoLabel } from '$lib/data/ai-nonhumans';
	import { getLocale } from '@src/paraglide/runtime.js';

	interface AIAgentProps {
		agent: AIAgent;
		messages?: AIMessage[];
		latestMessage?: string;
		previewOpen?: boolean;
		previewRank?: number;
		round: number;
		isActive?: boolean;
		isTyping?: boolean;
		bubbleSide?: 'left' | 'right';
		chatBoundsRect?: { left: number; top: number; right: number; bottom: number } | null;
		aquariumCenter?: { x: number; y: number } | null;
		maxBubbleDiameter?: number | null;
	}

	let {
		agent,
		messages = [],
		latestMessage = '',
		previewOpen = false,
		previewRank = 0,
		round,
		isActive = false,
		isTyping = false,
		bubbleSide = 'right',
		chatBoundsRect = null,
		aquariumCenter = null,
		maxBubbleDiameter = null
	}: AIAgentProps = $props();

	let canHover = $state(false);
	onMount(() => {
		if (typeof window === 'undefined') return;
		const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
		const update = () => (canHover = mql.matches);
		update();
		mql.addEventListener?.('change', update);
		return () => mql.removeEventListener?.('change', update);
	});

	// Filter messages for current round (fallback when latestMessage is not provided)
	const currentRoundMessages = $derived(
		messages.filter((msg) => {
			// Ensure both are numbers for comparison
			const msgRound = typeof msg.round === 'string' ? parseInt(msg.round) : msg.round;
			const currentRoundNum = typeof round === 'string' ? parseInt(round) : round;
			return msgRound === currentRoundNum;
		})
	);

	const resolvedLatestMessage = $derived(
		latestMessage && latestMessage.trim().length > 0
			? latestMessage.trim()
			: currentRoundMessages.length > 0
				? currentRoundMessages[currentRoundMessages.length - 1].content.trim()
				: ''
	);

	const showTypingBubble = $derived(isTyping);

	const roleColorClass = $derived.by(() => {
		// Fixed tailwind tokens to avoid theme overrides (no black)
		switch (agent.role) {
			case 'reception':
				return 'bg-sky-400';
			case 'research':
				return 'bg-emerald-500';
			case 'operations':
				return 'bg-amber-500';
			case 'bar':
				return 'bg-red-500';
			case 'administration':
				return 'bg-lime-500';
			case 'cleaning':
				return 'bg-teal-500';
			default:
				return 'bg-emerald-500';
		}
	});

	const cargoLabel = $derived.by(() => getAINonHumanCargoLabel(agent.name, getLocale()));
</script>

<div class="relative inline-block">
	<div data-badge-core class="flex flex-col items-center">
		<!-- AI Agent Avatar -->
		<div class="relative">
			<div
				class="h-12 w-12 md:h-14 md:w-14 rounded-full {roleColorClass} flex items-center justify-center border-2 border-white/30 shadow-lg relative z-20"
			>
				<Bot class="h-6 w-6 md:h-7 md:w-7 text-white" />
			</div>
		</div>

		<!-- Agent Name -->
		<div class="text-xs font-semibold text-deep-teal text-center max-w-[100px] truncate mt-1">
			<span class="inline-block rounded-full bg-white/45 px-2 py-[1px] shadow-sm">
				{agent.name}
			</span>
		</div>
		<!-- Agent Role Badge -->
		<div
			class="text-[11px] md:text-xs leading-tight text-gray-600 text-center max-w-[180px] md:max-w-[220px] whitespace-pre-line break-words"
			title={cargoLabel}
		>
			<span class="inline-block rounded-full bg-white/40 px-2 py-[1px] shadow-sm">
				{cargoLabel}
			</span>
		</div>
	</div>

	<!-- Chat circle: snippet by default; hover expands; tap opens centered modal on touch devices -->
	{#if showTypingBubble || resolvedLatestMessage.length > 0}
		{@const lastText = resolvedLatestMessage}
		{@const chatPositionClass = 'absolute -top-5 -right-0 z-30'}
		<div class={chatPositionClass}>
			<ChatCircleHover
				text={lastText}
				isTyping={showTypingBubble}
				typingStyle="dots"
				variant="ai"
				bubbleClass={roleColorClass}
				forcePreview={previewOpen}
				{previewRank}
				{canHover}
				boundsRect={chatBoundsRect}
				{aquariumCenter}
				maxDiameter={maxBubbleDiameter}
			/>
		</div>
	{/if}
</div>

<style>
	/* Animation for active agent */
	@keyframes pulse-active {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
