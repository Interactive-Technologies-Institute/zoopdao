<script lang="ts">
	import { Flag, Route, SquarePen, Check } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import type { PlayerState } from '@/types';

	interface StatusPillProps {
		playerState: PlayerState;
		currentRound: number;
		round7WritingMessage?: string | null;
	}

	let { playerState, currentRound, round7WritingMessage = null }: StatusPillProps = $props();

	function getWritingMessage(round: number) {
		switch (round) {
			case 1:
				return m.pill_round_1();
			case 2:
				return m.pill_round_2();
			case 3:
				return m.pill_round_3();
			case 4:
				return m.pill_round_4();
			case 5:
				return m.pill_round_5();
			case 6:
				return m.pill_round_6();
			case 7:
				return round7WritingMessage && round7WritingMessage.trim().length > 0
					? round7WritingMessage
					: m.pill_round_7();
			default:
				return m.write_next_part();
		}
	}
</script>

<div
	class="status-pill absolute left-1/2 -translate-x-1/2 z-30 max-w-[90vw] sm:max-w-[70vw] text-deep-teal px-3 sm:px-4 py-2 rounded-2xl flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold text-center whitespace-normal leading-snug bg-white/90"
	style="top: var(--status-pill-top, clamp(6.5rem,12vh,10rem));"
>
	{#if playerState.state === 'starting'}
		<span>
			{currentRound === 0 ? m.pill_round_0() : m.choose_starting_stop()}
		</span>
	{:else if playerState.state === 'moving'}
		<span> {m.choose_your_new_stop()}</span>
	{:else if playerState.state === 'writing'}
		<span> {getWritingMessage(currentRound)} </span>
	{:else if playerState.state === 'done'}
		<span> {m.you_are_done()} </span>
	{/if}
</div>
