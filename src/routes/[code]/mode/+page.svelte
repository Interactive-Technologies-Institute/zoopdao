<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '@/supabase';
	import type { PageData } from './$types';
	import { m } from '@src/paraglide/messages.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { createAudio, playAudio } from '$lib/utils/sound';
	import { Clock, Users } from 'lucide-svelte';
	import * as Dialog from '@/components/ui/dialog';
	import {
		PEDAGOGIC_FINAL_TIMER_MINUTES,
		PEDAGOGIC_ROUNDS_TIMER_MINUTES
	} from '$lib/config/organization';

	let click: HTMLAudioElement | null = null;

	onMount(() => {
		click = createAudio(clickSound, 0.5);
	});

	let { data }: { data: PageData } = $props();
	let isUpdating = $state(false);
	let pedagogicTimerDialogOpen = $state(false);
	let pedagogicRoundsMinutes = $state(PEDAGOGIC_ROUNDS_TIMER_MINUTES);
	let pedagogicFinalMinutes = $state(PEDAGOGIC_FINAL_TIMER_MINUTES);

	function openPedagogicTimerDialog() {
		// Pre-fill with DB values if they exist (otherwise organization defaults).
		const game: any = data.game as any;
		pedagogicRoundsMinutes =
			typeof game.pedagogic_rounds_timer_minutes === 'number'
				? game.pedagogic_rounds_timer_minutes
				: PEDAGOGIC_ROUNDS_TIMER_MINUTES;
		pedagogicFinalMinutes =
			typeof game.pedagogic_final_timer_minutes === 'number'
				? game.pedagogic_final_timer_minutes
				: PEDAGOGIC_FINAL_TIMER_MINUTES;
		pedagogicTimerDialogOpen = true;
	}

	async function selectMode(
		mode: 'pedagogic' | 'decision_making',
		timerConfig?: { roundsMinutes: number; finalMinutes: number }
	) {
		if (isUpdating) return;

		playAudio(click);
		isUpdating = true;

		try {
			const updatePayload: Record<string, unknown> = { mode };
			if (mode === 'pedagogic' && timerConfig) {
				updatePayload.pedagogic_rounds_timer_minutes = timerConfig.roundsMinutes;
				updatePayload.pedagogic_final_timer_minutes = timerConfig.finalMinutes;
			}

			const { error } = await supabase
				.from('games')
				.update(updatePayload as any)
				.eq('code', data.game.code);

			if (error) {
				console.error('Error updating discussion mode:', error);
				alert(m.mode_update_failed());
				isUpdating = false;
				return;
			}

			// Navigate to assembly
			goto(`/${data.game.code}/assembly`);
		} catch (error) {
			console.error('Error selecting mode:', error);
			alert(m.mode_select_failed());
			isUpdating = false;
		}
	}
</script>

<div class="h-full flex flex-col items-center justify-center bg-white relative p-4">
	<div
		class="sticky top-0 z-10 w-full bg-white border-b shadow-sm py-2 px-4 flex justify-between items-center"
	>
		<div class="bg-deep-teal p-2 flex flex-col items-center justify-center rounded-lg text-center">
			<p class="text-white md:text-sm text-xs font-medium">{m.discussion_code_label()}</p>
			<p class="text-white lg:text-4xl md:text-xl text-md font-bold">{data.game.code}</p>
		</div>
	</div>

	<div class="flex flex-col items-center justify-center max-w-2xl w-full">
		<h2 class="bos-title text-deep-teal text-2xl font-bold mb-8">{m.select_mode()}</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
			<!-- Pedagogic Mode -->
			<button
				onclick={openPedagogicTimerDialog}
				disabled={isUpdating}
				class="flex flex-col items-center justify-center p-8 bg-white border-2 border-deep-teal border-opacity-20 rounded-lg hover:border-deep-teal hover:border-opacity-60 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div class="mb-4">
					<Clock class="h-12 w-12 text-deep-teal" />
				</div>
				<h3 class="bos-title text-xl font-bold text-deep-teal mb-2">{m.pedagogic_mode()}</h3>
				<p class="text-gray-700 text-sm">{m.pedagogic_mode_description()}</p>
			</button>

			<!-- Decision-Making Mode -->
			<button
				onclick={() => selectMode('decision_making')}
				disabled={isUpdating}
				class="flex flex-col items-center justify-center p-8 bg-white border-2 border-deep-teal border-opacity-20 rounded-lg hover:border-deep-teal hover:border-opacity-60 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div class="mb-4">
					<Users class="h-12 w-12 text-deep-teal" />
				</div>
				<h3 class="bos-title text-xl font-bold text-deep-teal mb-2">{m.decision_making_mode()}</h3>
				<p class="text-gray-700 text-sm">{m.decision_making_mode_description()}</p>
			</button>
		</div>
	</div>
</div>

<Dialog.Root bind:open={pedagogicTimerDialogOpen}>
	<Dialog.Content class="w-[calc(100vw-2rem)] max-w-lg">
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<p class="bos-title text-deep-teal text-xl font-bold">
					{m.configure_pedagogic_timer_title()}
				</p>
				<p class="text-sm text-gray-600">{m.configure_pedagogic_timer_subtitle()}</p>
			</div>

			<div class="flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-semibold text-deep-teal">
						{m.configure_pedagogic_timer_rounds_label()}
					</span>
					<input
						type="number"
						min="1"
						max="120"
						inputmode="numeric"
						class="border border-deep-teal/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
						value={pedagogicRoundsMinutes}
						oninput={(e) => (pedagogicRoundsMinutes = Number((e.target as HTMLInputElement).value))}
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-semibold text-deep-teal">
						{m.configure_pedagogic_timer_final_label()}
					</span>
					<input
						type="number"
						min="1"
						max="120"
						inputmode="numeric"
						class="border border-deep-teal/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
						value={pedagogicFinalMinutes}
						oninput={(e) => (pedagogicFinalMinutes = Number((e.target as HTMLInputElement).value))}
					/>
				</label>
			</div>

			<div class="flex items-center justify-end gap-2">
				<button
					type="button"
					class="px-4 py-2 rounded-md border border-deep-teal/30 text-deep-teal text-sm font-semibold hover:border-deep-teal/60 hover:bg-gray-50"
					onclick={() => (pedagogicTimerDialogOpen = false)}
					disabled={isUpdating}
				>
					{m.cancel()}
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-md bg-deep-teal text-white text-sm font-semibold hover:bg-deep-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isUpdating ||
						!Number.isFinite(pedagogicRoundsMinutes) ||
						!Number.isFinite(pedagogicFinalMinutes) ||
						pedagogicRoundsMinutes <= 0 ||
						pedagogicFinalMinutes <= 0}
					onclick={() =>
						selectMode('pedagogic', {
							roundsMinutes: pedagogicRoundsMinutes,
							finalMinutes: pedagogicFinalMinutes
						})}
				>
					{m.save_and_continue()}
				</button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
