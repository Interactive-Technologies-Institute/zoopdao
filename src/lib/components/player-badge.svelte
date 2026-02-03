<script lang="ts">
	import type { Player, PlayerState } from '@/types';
	import { onMount } from 'svelte';
	import { Check, Flag, Route, SquarePen, User } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import ChatCircleHover from './chat-circle-hover.svelte';

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
		previewOpen?: boolean;
		previewRank?: number;
		chatBoundsRect?: { left: number; top: number; right: number; bottom: number } | null;
		aquariumCenter?: { x: number; y: number } | null;
		maxBubbleDiameter?: number | null;
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
		chatMessage = null,
		previewOpen = false,
		previewRank = 0,
		chatBoundsRect = null,
		aquariumCenter = null,
		maxBubbleDiameter = null
	}: PlayerBadgeProps = $props();

	let canHover = $state(false);
	onMount(() => {
		if (typeof window === 'undefined') return;
		const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
		const update = () => (canHover = mql.matches);
		update();
		mql.addEventListener?.('change', update);
		return () => mql.removeEventListener?.('change', update);
	});

	function getTranslation(key: string | null | undefined): string {
		if (!key) return '';
		const translation = (m as any)[key];
		return typeof translation === 'function' ? translation() : '';
	}

	const nicknameTrim = $derived.by(() => (player.nickname ?? '').trim());
	const roleLabel = $derived.by(() => {
		const roleRaw = ((player as any).role ?? null) as string | null;
		if (!roleRaw) return '-';
		const translated = getTranslation(`character_${roleRaw}_title`);
		return translated?.trim()?.length ? translated : roleRaw;
	});

	const onboardingFallback = $derived.by(() => {
		if (!isCurrentPlayer) return { name: null as string | null, role: null as string | null };
		if (typeof window === 'undefined') return { name: null as string | null, role: null as string | null };
		try {
			const raw = window.localStorage.getItem('zoopdao:onboarding:v1');
			if (!raw) return { name: null as string | null, role: null as string | null };
			const parsed = JSON.parse(raw) as { name?: string; role?: string | null; customRole?: string };

			const name = (parsed.name ?? '').trim();
			const role = parsed.role ?? null;
			const customRole = (parsed.customRole ?? '').trim();

			let roleLabel: string | null = null;
			if (role === 'other') {
				roleLabel = customRole.length > 0 ? customRole : null;
			} else if (role) {
				const translated = getTranslation(`character_${role}_title`);
				roleLabel = translated?.trim()?.length ? translated : role;
			}

			return {
				name: name.length > 0 ? name : null,
				role: roleLabel
			};
		} catch {
			return { name: null as string | null, role: null as string | null };
		}
	});

	const displayName = $derived.by(() => nicknameTrim.length > 0 ? nicknameTrim : onboardingFallback.name);
	const displayRole = $derived.by(() => {
		if (roleLabel !== '-') return roleLabel;
		return onboardingFallback.role ?? roleLabel;
	});
</script>

<div data-badge-core class="relative inline-block {isCurrentPlayer ? 'player-badges' : ''}">
	<div class="flex flex-col items-center">
		<div
			class="h-12 w-12 md:h-14 md:w-14 relative rounded-full z-20 flex items-center justify-center bg-gray-200 {isCurrentPlayer
				? 'border-4 border-deep-teal'
				: ''}"
		>
			<User class="h-6 w-6 md:h-7 md:w-7 text-gray-600" />
		</div>

		<!-- Show role for other participants and name when set -->
		<div class="mt-1 flex flex-col items-center max-w-[120px] md:max-w-[140px]">
			{#if displayName}
				<div class="text-xs font-semibold text-deep-teal text-center truncate w-full" title={displayName}>
					{displayName}
				</div>
			{/if}
			<div
				class="text-[11px] md:text-xs leading-tight text-gray-600 text-center whitespace-normal break-words line-clamp-2 min-h-[1.4rem]"
				title={displayRole}
			>
				{displayRole}
			</div>
		</div>
	</div>
	{#if currentRound === 7 && isCurrentPlayer}
		{@const lastText = (chatMessage ?? '').trim()}
		{@const showCircle = chatIsSending || chatIsTyping || lastText.length > 0}
	{@const showTypingBubble = chatIsSending || chatIsTyping}
		{#if showCircle}
			{@const circleSide = bubbleSide === 'left' ? 'right-full mr-2' : 'left-full ml-2'}
			<div class="absolute top-1/2 -translate-y-1/2 z-30 {circleSide}">
				<!-- Chat circle: snippet by default; hover expands inward; tap opens modal on touch devices -->
				<ChatCircleHover
					text={lastText}
					isTyping={showTypingBubble}
					typingStyle="pulse"
					variant="user"
					bubbleClass="bg-deep-teal"
					forcePreview={previewOpen}
					previewRank={previewRank}
					canHover={canHover}
					boundsRect={chatBoundsRect}
					aquariumCenter={aquariumCenter}
					maxDiameter={maxBubbleDiameter}
				/>
			</div>
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
