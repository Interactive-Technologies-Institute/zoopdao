<script lang="ts">
	import * as Dialog from './ui/dialog';
	import { Button } from './ui/button';
	import { m } from '@src/paraglide/messages';
	import { onMount } from 'svelte';

	interface ProposalDialogProps {
		open: boolean;
		proposalId: number | null;
	}

	let { open = $bindable(false), proposalId }: ProposalDialogProps = $props();

	let proposal = $state<any>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function fetchProposal() {
		if (!proposalId) {
			error = 'No proposal ID provided';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/proposals/${proposalId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch proposal');
			}
			const { proposal: proposalData } = await response.json();
			proposal = proposalData;
		} catch (err) {
			console.error('Error fetching proposal:', err);
			error = 'Failed to load proposal';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && proposalId) {
			if (!proposal) {
				fetchProposal();
			}
		} else if (!open) {
			// Reset state when dialog closes
			proposal = null;
			error = null;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="overflow-y-auto max-h-[95vh] w-[95vw] lg:max-w-4xl flex flex-col">
		{#if loading}
			<div class="flex items-center justify-center p-8">
				<p class="text-dark-green">{m.loading()}</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center p-8">
				<p class="text-red-600 mb-4">{error}</p>
				<Dialog.Close>
					<Button>{m.close()}</Button>
				</Dialog.Close>
			</div>
		{:else if proposal}
			<h2 class="text-2xl font-bold text-dark-green mb-6">{proposal.title}</h2>
			
			<div class="space-y-6 flex-grow">
				<!-- Theory of Change Section -->
				<div class="space-y-6">
					<h3 class="text-2xl font-bold text-dark-green">{m.theory_of_change()}</h3>
					
					<!-- Long-term Objectives -->
					<div class="space-y-4">
						<div class="block text-lg font-semibold text-dark-green">
							{m.long_term_objectives()}
							<span class="text-sm font-normal text-gray-600 ml-2">({m.long_term_objectives_description()})</span>
						</div>
						
						{#each proposal.objectives as objective, objectiveIndex}
							<div class="border-2 border-dark-green/20 rounded-lg p-4 bg-gray-50">
								<div class="mb-3">
									<span class="text-sm font-medium text-dark-green">
										{m.objective()} {objectiveIndex + 1}:
									</span>
									<p class="text-gray-700 mt-1">{objective.value}</p>
								</div>
								
								<!-- Preconditions -->
								<div class="ml-4 space-y-3 mt-4">
									<div class="block text-sm font-semibold text-dark-green">
										{m.preconditions_and_goals()}
										<span class="text-xs font-normal text-gray-600 ml-2">({m.preconditions_and_goals_description()})</span>
									</div>
									
									{#each objective.preconditions as precondition, preconditionIndex}
										<div class="border border-dark-green/10 rounded p-3 bg-white">
											<div class="mb-2">
												<span class="text-xs font-medium text-dark-green">
													{m.precondition()} {preconditionIndex + 1}:
												</span>
												<p class="text-gray-700 mt-1 text-sm">{precondition.value}</p>
											</div>
											
											<!-- Indicative Steps -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="block text-xs font-semibold text-dark-green">
													{m.indicative_steps()}
												</div>
												{#each precondition.indicativeSteps as step}
													<p class="text-gray-700 text-sm">{step.value}</p>
												{/each}
											</div>
											
											<!-- Key Indicators -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="block text-xs font-semibold text-dark-green">
													{m.key_indicators()}
													<span class="text-xs font-normal text-gray-600 ml-2">({m.key_indicators_description()})</span>
												</div>
												{#each precondition.keyIndicators as indicator}
													<p class="text-gray-700 text-sm">{indicator.value}</p>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Functionalities -->
					<div>
						<label class="block text-lg font-semibold text-dark-green mb-2">
							{m.functionalities()}
						</label>
						<div class="bg-gray-50 border border-dark-green/10 rounded p-4">
							<p class="text-gray-700 whitespace-pre-line">{proposal.functionalities}</p>
						</div>
					</div>
				</div>

				<!-- Discussion Field -->
				<div class="mt-6">
					<label class="block text-sm font-medium text-dark-green mb-2">
						{m.proposal_discussion()}
					</label>
					<div class="bg-gray-50 border border-dark-green/10 rounded p-4">
						<p class="text-gray-700 whitespace-pre-line">{proposal.discussion}</p>
					</div>
				</div>
			</div>
			
			<div class="flex w-full justify-center mt-6">
				<Dialog.Close>
					<Button>{m.back_to_game()}</Button>
				</Dialog.Close>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

