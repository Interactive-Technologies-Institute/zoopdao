<script lang="ts">
	import type { Player, PlayerState } from '@/types';
	import { onMount } from 'svelte';
	import { Check, Flag, Route, SquarePen, User } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';

	interface PlayerBadgeProps {
		player: Player;
		playerState: PlayerState;
		round: number;
		currentRound: number;
		tourCompleted: boolean;
		transitionState: 'starting' | 'transitioning' | 'ending' | 'ended';
		isCurrentPlayer?: boolean;
		bubbleSide?: 'left' | 'right';
		chatIsTyping?: boolean;
		chatIsSending?: boolean;
		chatDraft?: string;
		chatMessage?: string | null;
	}

	let {
		player,
		playerState,
		round,
		currentRound,
		tourCompleted,
		transitionState,
		isCurrentPlayer = false,
		bubbleSide = 'right',
		chatIsTyping = false,
		chatIsSending = false,
		chatDraft = '',
		chatMessage = null
	}: PlayerBadgeProps = $props();

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
</script>

<div data-badge-core class="relative inline-block {isCurrentPlayer ? 'player-badges' : ''}">
	<div
		class="h-12 w-12 md:h-14 md:w-14 relative rounded-full z-20 flex items-center justify-center bg-gray-200 {isCurrentPlayer
			? 'border-4 border-deep-teal'
			: ''}"
	>
		<User class="h-6 w-6 md:h-7 md:w-7 text-gray-600" />
	</div>
	{#if currentRound === 7 && isCurrentPlayer}
		{@const lastText = (chatMessage ?? '').trim()}
		{@const showCircle = chatIsSending || chatIsTyping || lastText.length > 0}
		{#if showCircle}
			{@const circleSide = bubbleSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}
			<div class="absolute top-1/2 -translate-y-1/2 z-30 {circleSide}">
				<!-- Chat circle: snippet by default; hover expands; tap opens a centered modal on touch devices -->
				<div class="relative group">
					<button
						type="button"
						class="h-9 w-9 rounded-full bg-deep-teal text-white shadow-lg flex items-center justify-center overflow-hidden select-none"
						aria-label="Open message"
						onclick={() => {
							if (!canHover) showChatModal = true;
						}}
					>
						{#if chatIsSending || chatIsTyping}
							<span class="h-2 w-2 rounded-full bg-white/80 animate-pulse"></span>
						{:else}
							<span class="px-1 text-[10px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis"
								>{snippet(lastText)}</span
							>
						{/if}
					</button>

					{#if canHover && !chatIsSending && !chatIsTyping && lastText.length > 0}
						<div
							class="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity absolute -top-2 {bubbleSide === 'left'
								? 'right-full mr-2'
								: 'left-full ml-2'}"
						>
							<div
								class="rounded-2xl bg-deep-teal text-white shadow-xl px-4 py-3 max-w-[min(22rem,calc(100vw-6rem))] whitespace-normal break-words"
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
						class="relative w-full max-w-[560px] rounded-2xl bg-deep-teal text-white shadow-2xl px-5 py-4"
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
	{:else if currentRound === 7}
		<div
			class="absolute -top-2 rounded-full bg-deep-teal text-white z-30 flex items-center py-2 px-3 max-w-xs whitespace-nowrap {bubbleSide === 'left' ? 'right-full mr-2 origin-left' : 'left-full ml-2 origin-right'}"
		>
			{#if playerState.state === 'starting'}
				<div class="flex items-center gap-2">
					<Flag class="w-3 h-3 stroke-white" />
					{#if isCurrentPlayer}
						<span class="text-white text-xs text-nowrap">{m.starting()}</span>
					{:else}
						<span class="text-white text-xs text-nowrap"
							>{m.starting_player({ nickname: player.nickname ?? '' })}</span
						>
					{/if}
				</div>
			{:else if playerState.state === 'moving'}
				<div class="flex items-center gap-2">
					<Route class="w-3 h-3 stroke-white" />
					{#if isCurrentPlayer}
						<span class="text-white text-xs text-nowrap">{m.moving()}</span>
					{:else}
						<span class="text-white text-xs text-nowrap"
							>{m.moving_player({ nickname: player.nickname ?? '' })}</span
						>
					{/if}
				</div>
			{:else if playerState.state === 'writing'}
				<div class="flex items-center gap-2">
					<SquarePen class="w-3 h-3 stroke-white" />
					{#if isCurrentPlayer}
						<span class="text-white text-xs text-nowrap">{m.writing()}</span>
					{:else}
						<span class="text-white text-xs text-nowrap"
							>{m.writing_player({ nickname: player.nickname ?? '' })}</span
						>
					{/if}
				</div>
			{:else if playerState.state === 'done'}
				<div class="flex items-center gap-2">
					<Check class="w-3 h-3 stroke-white" />
					{#if isCurrentPlayer}
						<span class="text-white text-xs text-nowrap">{m.done()}</span>
					{:else}
						<span class="text-white text-xs text-nowrap"
							>{m.done_player({ nickname: player.nickname ?? '' })}</span
						>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
