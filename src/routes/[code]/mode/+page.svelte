<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '@/supabase';
	import type { PageData } from './$types';
	import { m } from '@src/paraglide/messages.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { Clock, Users } from 'lucide-svelte';

	let click: HTMLAudioElement;

	onMount(() => {
		click = new Audio(clickSound);
		click.volume = 0.5;
	});

	let { data }: { data: PageData } = $props();
	let isUpdating = $state(false);

	async function selectMode(mode: 'pedagogic' | 'decision_making') {
		if (isUpdating) return;
		
		click.play();
		isUpdating = true;

		try {
			const { error } = await supabase
				.from('games')
				.update({ mode })
				.eq('code', data.game.code);

			if (error) {
				console.error('Error updating game mode:', error);
				alert('Failed to update mode. Please try again.');
				isUpdating = false;
				return;
			}

			// Navigate to lobby
			goto(`/${data.game.code}/lobby`);
		} catch (error) {
			console.error('Error selecting mode:', error);
			alert('Failed to select mode. Please try again.');
			isUpdating = false;
		}
	}
</script>

<div class="h-full flex flex-col items-center justify-center bg-white relative p-4">
	<div class="sticky top-0 z-10 w-full bg-white border-b shadow-sm py-2 px-4 flex justify-between items-center">
		<div class="bg-dark-green p-2 flex flex-col items-center justify-center rounded-lg text-center">
			<p class="text-white md:text-sm text-xs font-medium">Lobby code</p>
			<p class="text-white lg:text-4xl md:text-xl text-md font-bold">{data.game.code}</p>
		</div>
	</div>

	<div class="flex flex-col items-center justify-center max-w-2xl w-full">
		<h2 class="text-dark-green text-2xl font-bold mb-8">{m.select_mode()}</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
			<!-- Pedagogic Mode -->
			<button
				onclick={() => selectMode('pedagogic')}
				disabled={isUpdating}
				class="flex flex-col items-center justify-center p-8 bg-white border-2 border-dark-green/20 rounded-lg hover:border-dark-green/60 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div class="mb-4">
					<Clock class="h-12 w-12 text-dark-green" />
				</div>
				<h3 class="text-xl font-bold text-dark-green mb-2">{m.pedagogic_mode()}</h3>
				<p class="text-gray-700 text-sm">{m.pedagogic_mode_description()}</p>
			</button>

			<!-- Decision-Making Mode -->
			<button
				onclick={() => selectMode('decision_making')}
				disabled={isUpdating}
				class="flex flex-col items-center justify-center p-8 bg-white border-2 border-dark-green/20 rounded-lg hover:border-dark-green/60 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div class="mb-4">
					<Users class="h-12 w-12 text-dark-green" />
				</div>
				<h3 class="text-xl font-bold text-dark-green mb-2">{m.decision_making_mode()}</h3>
				<p class="text-gray-700 text-sm">{m.decision_making_mode_description()}</p>
			</button>
		</div>
	</div>
</div>

