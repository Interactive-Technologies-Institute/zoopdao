<script lang="ts">
	import type { Card } from '@/types';

	interface CardProps {
		card: Card;
		className?: string;
	}

	let { card, className = '' }: CardProps = $props();

	const cardColors = {
		landmark: 'border-dark-deep',
		nature: 'border-sea-green',
		sense: 'border-sand',
		history: 'border-sand',
		action: 'border-driftwood'
	} as const;

	let borderColor = cardColors[card.type as keyof typeof cardColors];
</script>

<div
	class="w-64 h-96 bg-white rounded-xl bg-cover border {borderColor} {className}"
	style="background-image: url('/images/cards/{card.type}.svg');"
>
	<div class="h-1/4 w-full flex items-center pl-24">
		<h3 class="text-white font-bold leading-snug text-xl">
			{card.title}
		</h3>
	</div>
	<p class="px-4 text-pretty leading-snug relative">
		<span class="absolute mx-5 inset-0 bg-white [box-shadow:0_0_15px_15px_white]"></span>
		<span class="relative z-10 whitespace-pre-line">{card.text}</span>
	</p>
</div>
