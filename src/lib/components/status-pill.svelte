<script lang="ts">
	import { Flag, Route, SquarePen, Check } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import type { PlayerState } from '@/types';

	interface StatusPillProps {
		playerState: PlayerState;
		currentRound: number;
	}

	let { playerState, currentRound }: StatusPillProps = $props();
</script>

<div
	class="absolute top-[clamp(6.5rem,12vh,10rem)] left-1/2 -translate-x-1/2 z-30 max-w-[90vw] sm:max-w-[70vw] text-deep-teal px-3 sm:px-4 py-2 rounded-2xl flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold text-center whitespace-normal leading-snug bg-white/90"
>
	{#if playerState.state === 'starting'}
		<span> {m.choose_starting_stop()}</span>
	{:else if playerState.state === 'moving'}
		<span> {m.choose_your_new_stop()}</span>
	{:else if playerState.state === 'writing'}
		<span> {m.write_next_part()} </span>
	{:else if playerState.state === 'done'}
		<span> {m.you_are_done()} </span>
	{/if}
</div>
