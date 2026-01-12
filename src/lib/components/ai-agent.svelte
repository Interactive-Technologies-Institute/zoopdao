<script lang="ts">
	import type { AIAgent, AIMessage } from '@/types';
	import { Bot } from 'lucide-svelte';

	interface AIAgentProps {
		agent: AIAgent;
		messages?: AIMessage[];
		round: number;
		isActive?: boolean;
	}

	let { agent, messages = [], round, isActive = false }: AIAgentProps = $props();
	
	// Filter messages for current round
	const currentRoundMessages = $derived(
		messages.filter(msg => msg.round === round)
	);
</script>

<div class="flex flex-col items-center gap-2 relative">
	<!-- AI Agent Avatar -->
	<div class="relative">
		<div class="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-500 shadow-lg">
			<Bot class="h-6 w-6 md:h-7 md:w-7 text-white" />
		</div>
		{#if isActive}
			<div class="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
		{/if}
	</div>
	
	<!-- Agent Name -->
	<div class="text-xs font-semibold text-dark-green text-center max-w-[80px] truncate">
		{agent.name}
	</div>
	
	<!-- Agent Role Badge -->
	<div class="text-xs text-gray-600 text-center max-w-[80px] truncate">
		{agent.role}
	</div>
	
	<!-- Messages Bubble (if any messages for current round) -->
	{#if currentRoundMessages.length > 0}
		<div class="absolute -top-2 left-full ml-2 bg-white rounded-lg shadow-lg border-2 border-blue-200 p-2 max-w-[200px] z-50">
			<div class="text-xs font-semibold text-blue-600 mb-1">{agent.name}:</div>
			{#each currentRoundMessages as message}
				<div class="text-xs text-gray-700 mb-1 last:mb-0">
					{message.content}
				</div>
			{/each}
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

