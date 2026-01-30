<script lang="ts">
	import { onMount } from 'svelte';
	import type { AquariumLayoutState } from '@/state/aquarium-layout.svelte';

	interface MapProps {
		layout: AquariumLayoutState;
	}

	let { layout }: MapProps = $props();

	let mapContainer: HTMLDivElement;

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				layout.setContainerSize(width, height);
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
	class="bg-[#b3e4eb] bos-bg w-full h-full overflow-hidden touch-none relative flex items-center justify-center"
	bind:this={mapContainer}
	role="region"
	aria-label="Assembly aquarium table"
>
	<!-- Aquarium Assembly Table Image -->
	<div class="relative w-full h-full flex items-center justify-center">
		<div class="absolute h-[46vh] w-[62vw] inset-0 m-auto pointer-events-none map-highlight"></div>
		<img
			src="/images/aquarium/assembly_table.svg"
			alt="Assembly Aquarium Table"
			class="absolute inset-0 w-[85%] h-[85%] sm:w-[80%] sm:h-[80%] md:w-[72%] md:h-[72%] lg:w-[64%] lg:h-[64%] xl:w-[58%] xl:h-[58%] m-auto object-contain pointer-events-none select-none"
			draggable="false"
		/>
	</div>
</div>
