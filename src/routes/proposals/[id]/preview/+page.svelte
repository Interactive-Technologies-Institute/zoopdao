<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { ArrowLeft, Calendar, Clock } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import { localizeUrl } from '@src/paraglide/runtime.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';
	import { getVotingPeriods, getExceptionalVotingPeriods } from '$lib/data/voting-periods';

	let { data }: { data: PageData } = $props();

	let click_sound: HTMLAudioElement;
	let isCreatingGame = $state(false);

	onMount(() => {
		click_sound = new Audio(clickSound);
		click_sound.volume = 0.5;
	});

	const proposal = $derived(data.proposal);
	const status = $derived(data.status);
	const allPeriods = $derived(data.allPeriods);

	function getVotingPeriodLabelById(periodId: string): string {
		return allPeriods.find(p => p.id === periodId)?.label || periodId;
	}

	async function handleStartDiscussion() {
		if (isCreatingGame) return;
		
		click_sound.play();
		isCreatingGame = true;
		
		try {
			// Ensure we have a session (anonymous or authenticated)
			const { data: { session }, error: sessionError } = await supabase.auth.getSession();
			
			if (!session) {
				// Create anonymous session if none exists
				const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
				
				if (authError || !authData.session) {
					console.error('Error creating anonymous session:', authError);
					alert('Failed to create session. Please try again.');
					isCreatingGame = false;
					return;
				}
			}
			
			// Create a new game with proposal_id
			const { data: gameData, error: gameError } = await supabase.rpc('create_game', {
				p_proposal_id: proposal.id,
				p_mode: 'pedagogic'
			});
			
			if (gameError) {
				console.error('Error creating game:', gameError);
				alert(`Failed to create discussion: ${gameError.message}. Please try again.`);
				isCreatingGame = false;
				return;
			}
			
			if (!gameData?.game_code) {
				console.error('Error creating game: Missing game_code in response.', gameData);
				alert('Failed to create discussion. Please try again.');
				isCreatingGame = false;
				return;
			}

			// Navigate to mode selection with the game code
			goto(`/${gameData.game_code}/mode`);
		} catch (error) {
			console.error('Error starting discussion:', error);
			alert(`Failed to start discussion: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
			isCreatingGame = false;
		}
	}

	function handleViewFullProposal() {
		click_sound.play();
		goto(localizeUrl(`/proposals/${proposal.id}`).toString());
	}

	function handleBack() {
		click_sound.play();
		goto(localizeUrl('/').toString());
	}
</script>

<div class="min-h-screen bg-[#efe7e2] p-4">
	<div class="max-w-3xl mx-auto">
		<!-- Back Button -->
		<div class="mb-4">
			<Button variant="ghost" size="icon" onclick={handleBack} class="text-deep-teal">
				<ArrowLeft class="h-6 w-6" />
			</Button>
		</div>

		<!-- Preview Card -->
		<div class="bg-white rounded-lg border-2 border-deep-teal border-opacity-20 p-6 md:p-8 shadow-lg">
			<!-- Header -->
			<div class="mb-6">
				<h1 class="text-3xl font-bold text-deep-teal mb-4">{proposal.title}</h1>
				
				<div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4" />
						<span>{m.voting_period()}: {getVotingPeriodLabelById(proposal.voting_period_id)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4" />
						<span class={`font-semibold ${status === 'open' ? 'text-green-600' : 'text-gray-400'}`}>
							{status === 'open' ? m.proposal_status_open() : m.proposal_status_closed()}
						</span>
					</div>
				</div>
			</div>

			<!-- Preview Content -->
			<div class="space-y-4 mb-6">
				<!-- Objectives Preview -->
				<div>
					<h3 class="text-lg font-semibold text-deep-teal mb-2">{m.long_term_objectives()}</h3>
					<ul class="list-disc list-inside space-y-1 text-gray-700">
						{#each proposal.objectives.slice(0, 2) as objective}
							<li>{objective.value}</li>
						{/each}
					</ul>
				</div>

				<!-- Functionalities Preview -->
				<div>
					<h3 class="text-lg font-semibold text-deep-teal mb-2">{m.functionalities()}</h3>
					<p class="text-gray-700 line-clamp-3">{proposal.functionalities}</p>
				</div>

			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
				{#if status === 'open'}
					<Button 
						size="lg" 
						onclick={handleStartDiscussion}
						disabled={isCreatingGame}
						class="flex-1"
					>
						{isCreatingGame ? m.loading() : m.start_discussion()}
					</Button>
					<Button 
						variant="outline" 
						size="lg"
						onclick={handleViewFullProposal}
						class="flex-1"
					>
						{m.view_full_proposal()}
					</Button>
				{:else}
					<Button 
						size="lg" 
						onclick={handleViewFullProposal}
						class="w-full"
					>
						{m.view_full_proposal()}
					</Button>
				{/if}
			</div>
		</div>
	</div>
</div>
