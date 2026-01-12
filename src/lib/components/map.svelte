<script lang="ts">
	import type { GameState } from '@/state/game-state.svelte';
	import type { MapPosition } from '@/state/map-position.svelte';
	import { onMount } from 'svelte';

	interface MapProps {
		tourCompleted: boolean;
		gameState: GameState;
		position: MapPosition;
	}

	let { gameState, position, tourCompleted }: MapProps = $props();

	let mapContainer: HTMLDivElement;

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				position.setContainerSize(width, height);
			}
		});

		resizeObserver.observe(mapContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<!-- Aquarium Assembly Table Container -->
<div
	class="bg-[#b3e4eb] w-full h-full overflow-hidden touch-none relative flex items-center justify-center"
	bind:this={mapContainer}
	role="region"
	aria-label="Assembly aquarium table"
>
	<!-- Aquarium Assembly Table Image -->
	<div class="relative w-full h-full flex items-center justify-center">
		<div class="absolute h-[50vh] w-[70vw] inset-0 m-auto pointer-events-none map-highlight"></div>
		<img
			src="/images/aquarium/assembly_table.svg"
			alt="Assembly Aquarium Table"
			class="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
			draggable="false"
		/>
	</div>
</div>
