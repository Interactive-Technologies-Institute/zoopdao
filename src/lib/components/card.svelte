<script lang="ts">
	import type { Card } from '@/types';
	import { ZOOP_THEME_ASSET_PREFIX } from '$lib/config/theme';

	type CardWithAsset = Card & { assetType?: string };

	interface CardProps {
		card: CardWithAsset;
		className?: string;
	}

	let { card, className = '' }: CardProps = $props();
	let expanded = $state(false);
	let pinned = $state(false);
	const showMore = $derived(!!card.text && card.text.length > 220);

	const cardColors = {
		landmark: 'border-dark-deep',
		nature: 'border-sea-green',
		sense: 'border-sand',
		history: 'border-sand',
		action: 'border-driftwood'
	} as const;

	let borderColor = cardColors[card.type as keyof typeof cardColors];
	const assetType = card.assetType ?? card.type;

	const heightClass = $derived(expanded ? 'h-auto min-h-96' : 'h-96');

	function openPreview() {
		if (pinned) return;
		expanded = true;
	}

	function closePreview() {
		if (pinned) return;
		expanded = false;
	}

	function togglePinned() {
		pinned = !pinned;
		expanded = pinned ? true : false;
	}
</script>

<div
	class="w-64 {heightClass} bg-white rounded-xl bg-cover border {borderColor} {className} flex flex-col overflow-hidden transition-[height] duration-200"
	style={`background-image: url('${ZOOP_THEME_ASSET_PREFIX}/cards/${assetType}.svg');`}
	onmouseenter={openPreview}
	onmouseleave={closePreview}
>
	<div class="h-24 w-full flex items-center pl-24">
		<h3 class="text-white font-bold leading-snug text-xl">
			{card.title}
		</h3>
	</div>
	<div class="relative flex-1 px-4 pb-4 min-h-0">
		<div class="relative h-full rounded-lg bg-white/95 px-4 py-3 [box-shadow:0_0_18px_18px_rgba(255,255,255,0.92)]">
			<span
				class={`block whitespace-pre-line break-words text-pretty leading-snug ${expanded ? '' : 'line-clamp-10'}`}
			>
				{card.text}
			</span>
			{#if showMore}
				<button
					type="button"
					class="absolute bottom-2 right-2 rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs font-semibold text-black hover:bg-yellow-200 active:bg-yellow-300"
					onmouseenter={openPreview}
					onclick={togglePinned}
				>
					{expanded ? (pinned ? 'Fechar' : 'Ver mais') : 'Ver mais'}
				</button>
			{/if}
		</div>
	</div>
</div>
