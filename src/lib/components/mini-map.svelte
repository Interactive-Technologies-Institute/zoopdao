<script lang="ts">
	import type { MapPosition } from '@/state/map-position.svelte';

	interface MapProps {
		position: MapPosition;
	}

	let { position }: MapProps = $props();
</script>

<div class="absolute bottom-4 right-4 border-2 border-dark-green overflow-hidden rounded">
	<div class="bg-[#b3e4eb] relative w-[calc(100vw/10)] h-[calc(100vh/10)]">
		<img src="/images/aquarium/assembly_table.svg" alt="Assembly Aquarium Minimap" class="w-full h-full object-contain" />
	</div>
</div>
