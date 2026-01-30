<script lang="ts">
	import { onMount } from 'svelte';
	import type { AquariumLayoutState } from '@/state/aquarium-layout.svelte';

	interface MapProps {
		layout: AquariumLayoutState;
	}

	let { layout }: MapProps = $props();

	let mapContainer: HTMLDivElement;
	let aquariumImage: HTMLImageElement;

	function updateLayout() {
		if (!mapContainer || !aquariumImage) return;
		const containerRect = mapContainer.getBoundingClientRect();
		const imageRect = aquariumImage.getBoundingClientRect();

		layout.setContainerSize(containerRect.width, containerRect.height);
		layout.setAquariumRect(
			imageRect.left - containerRect.left,
			imageRect.top - containerRect.top,
			imageRect.width,
			imageRect.height
		);
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				layout.setContainerSize(entry.contentRect.width, entry.contentRect.height);
				requestAnimationFrame(updateLayout);
			}
		});

		resizeObserver.observe(mapContainer);
		requestAnimationFrame(updateLayout);

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
	<div class="relative w-full h-full flex items-center justify-center translate-y-[-2%] md:translate-y-[-3%] xl:translate-y-[-5%]">
		<div class="absolute h-[46vh] w-[62vw] inset-0 m-auto pointer-events-none map-highlight"></div>
		<img
			src="/images/aquarium/assembly_table.svg"
			alt="Assembly Aquarium Table"
			bind:this={aquariumImage}
			class="absolute inset-0 w-[85%] h-[85%] sm:w-[80%] sm:h-[80%] md:w-[72%] md:h-[72%] lg:w-[64%] lg:h-[64%] xl:w-[58%] xl:h-[58%] m-auto object-contain pointer-events-none select-none"
			draggable="false"
		/>
	</div>
</div>
