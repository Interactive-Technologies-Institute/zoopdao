<script lang="ts">
import type { AquariumLayoutState } from '@/state/aquarium-layout.svelte';

	interface MapProps {
		layout: AquariumLayoutState;
	}

	let { layout }: MapProps = $props();
	void layout;

	let boundaryEl: HTMLDivElement;
</script>

<!-- Aquarium Assembly Table Container -->
<div
	class="bg-[#b3e4eb] bos-bg w-full h-full overflow-hidden touch-none relative flex items-center justify-center"
	role="region"
	aria-label="Assembly aquarium table"
>
	<!-- Aquarium Assembly Table Image -->
	<div class="relative w-full h-full flex items-center justify-center">
		<div
			bind:this={boundaryEl}
			class="absolute inset-0 m-auto pointer-events-none map-highlight aquarium-boundary w-[85%] h-[85%] sm:w-[80%] sm:h-[80%] md:w-[72%] md:h-[72%] lg:w-[64%] lg:h-[64%] xl:w-[58%] xl:h-[58%]"
		></div>
		<img
			src="/images/aquarium/assembly_table.svg"
			alt="Assembly Aquarium Table"
			class="absolute inset-0 w-[85%] h-[85%] sm:w-[80%] sm:h-[80%] md:w-[72%] md:h-[72%] lg:w-[64%] lg:h-[64%] xl:w-[58%] xl:h-[58%] m-auto object-contain pointer-events-none select-none map-image"
			draggable="false"
		/>
	</div>
</div>
