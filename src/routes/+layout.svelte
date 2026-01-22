<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { applyZoopTheme } from '$lib/config/theme';

	let { children } = $props();

	onMount(() => {
		applyZoopTheme();
	});
</script>

{@render children()}
