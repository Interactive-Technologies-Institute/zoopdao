<script lang="ts">
	import type { AIAgent, AIMessage } from '@/types';
	import { Bot } from 'lucide-svelte';
	import TypingIndicator from './typing-indicator.svelte';

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
	
	<!-- Pop-up Message Bubble (similar to player badge) -->
	{#if isTyping || currentRoundMessages.length > 0}
		<div class="absolute -top-2 rounded-full bg-blue-500 text-white z-30 flex items-center py-2 px-3 max-w-xs whitespace-normal {bubbleSide === 'left' ? 'right-full mr-2 origin-left' : 'left-full ml-2 origin-right'}">
			{#if isTyping}
				<TypingIndicator />
			{:else if currentRoundMessages.length > 0}
				<!-- Show the most recent message -->
				<span class="text-white text-xs">
					{currentRoundMessages[currentRoundMessages.length - 1].content}
				</span>
			{/if}
		</div>
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
