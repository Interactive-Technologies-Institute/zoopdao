<script lang="ts">
	import type { AIAgent, AIMessage } from '@/types';
	import { Bot } from 'lucide-svelte';
	import TypingIndicator from './typing-indicator.svelte';
	import { onMount } from 'svelte';

	interface AIAgentProps {
		agent: AIAgent;
		messages?: AIMessage[];
		round: number;
		isActive?: boolean;
		isTyping?: boolean;
		bubbleSide?: 'left' | 'right';
	}

	let {
		agent,
		messages = [],
		round,
		isActive = false,
		isTyping = false,
		bubbleSide = 'right'
	}: AIAgentProps = $props();

	let canHover = $state(false);
	let showChatModal = $state(false);

	function snippet(text: string, maxChars = 12) {
		const t = text.trim().replace(/\s+/g, ' ');
		if (t.length <= maxChars) return t;
		return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
	}

	onMount(() => {
		if (typeof window === 'undefined') return;
		const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
		const update = () => (canHover = mql.matches);
		update();
		mql.addEventListener?.('change', update);
		return () => mql.removeEventListener?.('change', update);
	});
	
	// Filter messages for current round
	const currentRoundMessages = $derived(
		messages.filter(msg => {
			// Ensure both are numbers for comparison
			const msgRound = typeof msg.round === 'string' ? parseInt(msg.round) : msg.round;
			const currentRoundNum = typeof round === 'string' ? parseInt(round) : round;
			return msgRound === currentRoundNum;
		})
	);
	
	// Debug: log messages
	$effect(() => {
		if (messages.length > 0 || isTyping) {
			console.log(`AI Agent ${agent.name}:`, {
				messages: messages.length,
				currentRoundMessages: currentRoundMessages.length,
				round,
				isTyping,
				messagesData: messages
			});
		}
	});
</script>

<div class="relative inline-block">
	<div data-badge-core class="flex flex-col items-center">
		<!-- AI Agent Avatar -->
		<div class="relative">
			<div class="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-500 shadow-lg relative z-20">
				<Bot class="h-6 w-6 md:h-7 md:w-7 text-white" />
			</div>
			{#if isActive}
				<div class="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse z-30"></div>
			{/if}
		</div>

		<!-- Agent Name -->
		<div class="text-xs font-semibold text-deep-teal text-center max-w-[80px] truncate mt-1">
			{agent.name}
		</div>
		<!-- Agent Role Badge -->
		<div class="text-xs text-gray-600 text-center max-w-[80px] truncate">
			{agent.role}
		</div>
	</div>
	
	<!-- Chat circle: snippet by default; hover expands; tap opens centered modal on touch devices -->
	{#if isTyping || currentRoundMessages.length > 0}
		{@const lastText = currentRoundMessages.length > 0
			? currentRoundMessages[currentRoundMessages.length - 1].content.trim()
			: ''}
		{@const circleSide = bubbleSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}
		<div class="absolute top-1/2 -translate-y-1/2 z-30 {circleSide}">
			<div class="relative group">
				<button
					type="button"
					class="h-9 w-9 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center overflow-hidden select-none"
					aria-label="Open message"
					onclick={() => {
						if (!canHover && lastText.length > 0) showChatModal = true;
					}}
				>
					{#if isTyping}
						<div class="flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-white/90 animate-bounce [animation-delay:0ms]"></span>
							<span class="h-1.5 w-1.5 rounded-full bg-white/90 animate-bounce [animation-delay:150ms]"></span>
							<span class="h-1.5 w-1.5 rounded-full bg-white/90 animate-bounce [animation-delay:300ms]"></span>
						</div>
					{:else}
						<span class="px-1 text-[10px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis"
							>{snippet(lastText)}</span
						>
					{/if}
				</button>

				{#if canHover && !isTyping && lastText.length > 0}
					<div
						class="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity absolute -top-2 {bubbleSide === 'left'
							? 'right-full mr-2'
							: 'left-full ml-2'}"
					>
						<div
							class="rounded-2xl bg-blue-500 text-white shadow-xl px-4 py-3 max-w-[min(22rem,calc(100vw-6rem))] whitespace-normal break-words"
						>
							<span class="text-xs">{lastText}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if showChatModal && lastText.length > 0}
			<div
				class="fixed inset-0 z-[200] flex items-center justify-center p-4"
				role="dialog"
				aria-modal="true"
				onclick={() => (showChatModal = false)}
				onkeydown={(e) => {
					if (e.key === 'Escape') showChatModal = false;
				}}
				tabindex="0"
			>
				<div class="absolute inset-0 bg-black/40"></div>
				<div
					class="relative w-full max-w-[560px] rounded-2xl bg-blue-500 text-white shadow-2xl px-5 py-4"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						class="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/15 hover:bg-white/25"
						aria-label="Close"
						onclick={() => (showChatModal = false)}
					>
						<span class="sr-only">Close</span>
						<span aria-hidden="true" class="text-lg leading-none">×</span>
					</button>
					<div class="text-sm whitespace-normal break-words pr-10">{lastText}</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Animation for active agent */
	@keyframes pulse-active {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
