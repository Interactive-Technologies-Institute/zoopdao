<script lang="ts">
	import * as Dialog from './ui/dialog';
	import { Button } from './ui/button';
	import { m } from '@src/paraglide/messages';
	import { getLocale } from '@src/paraglide/runtime.js';

	interface ProposalDialogProps {
		open: boolean;
		proposalId: number | null;
	}

	let { open = $bindable(false), proposalId }: ProposalDialogProps = $props();

	let proposal = $state<any>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const proposalFormatLabel = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt')
			? 'Formato da proposta baseado na Teoria da Mudança'
			: 'Proposal format based on Theory of Change'
	);
	const longTermObjectivesLabel = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt')
			? 'Objetivos a longo prazo'
			: 'Long-term goals'
	);
	const preconditionsLabel = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt')
			? 'Pré-condições e requisitos'
			: 'Preconditions and requirements'
	);
	const indicativeStepsLabel = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt')
			? 'Etapas iniciais'
			: 'Initial steps'
	);
	const keyIndicatorsLabel = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt')
			? 'Indicadores-chave de desempenho'
			: 'Key performance indicators'
	);
	const proposalFallbackTitle = $derived.by(() =>
		getLocale().toLowerCase().startsWith('pt') ? 'Proposta' : 'Proposal'
	);

	async function fetchProposal() {
		if (!proposalId) {
			error = null; // Don't show error if no proposal_id, just show empty state
			loading = false;
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/proposals/${proposalId}`);
			if (!response.ok) {
				throw new Error(m.proposal_load_failed());
			}
			const { proposal: proposalData } = await response.json();
			
			// Ensure objectives is parsed if it comes as a string (JSONB from Supabase)
			if (proposalData && proposalData.objectives) {
				if (typeof proposalData.objectives === 'string') {
					try {
						proposalData.objectives = JSON.parse(proposalData.objectives);
					} catch (parseError) {
						console.error('Error parsing objectives:', parseError);
					}
				}
			}
			
			proposal = proposalData;
		} catch (err) {
			console.error('Error fetching proposal:', err);
			error = m.proposal_load_failed();
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && proposalId) {
			// Always fetch when dialog opens to ensure fresh data
			fetchProposal();
		} else if (!open) {
			// Reset state when dialog closes
			proposal = null;
			error = null;
			loading = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="overflow-y-auto max-h-[95vh] w-[95vw] lg:max-w-4xl flex flex-col">
		{#if loading}
			<div class="flex items-center justify-center p-8">
				<p class="text-deep-teal">{m.loading()}</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center p-8">
				<p class="text-red-600 mb-4">{error}</p>
				<Dialog.Close>
					<Button>{m.close()}</Button>
				</Dialog.Close>
			</div>
		{:else if !proposalId}
			<div class="flex flex-col items-center justify-center p-8">
				<p class="text-gray-600 mb-4">{m.no_proposal_available()}</p>
				<Dialog.Close>
					<Button>{m.close()}</Button>
				</Dialog.Close>
			</div>
		{:else if proposal}
			<h2 class="text-2xl font-bold text-deep-teal mb-6">
				{proposal.title || proposalFallbackTitle}
			</h2>
			
			<div class="space-y-6 flex-grow">
				<!-- Theory of Change Section -->
				<div class="space-y-6">
					<h3 class="text-xl font-medium text-deep-teal">{proposalFormatLabel}</h3>
					
					<!-- Long-term Objectives -->
					{#if proposal.objectives && Array.isArray(proposal.objectives) && proposal.objectives.length > 0}
					<div class="space-y-4">
						<div class="block text-lg font-semibold text-deep-teal">
							{longTermObjectivesLabel}
						</div>
						
						{#each proposal.objectives as objective, objectiveIndex}
							<div class="border-2 border-deep-teal border-opacity-20 rounded-lg p-4 bg-gray-50">
								<div class="mb-3">
									<span class="text-sm font-medium text-deep-teal">
										{m.objective()} {objectiveIndex + 1}:
									</span>
									<p class="text-gray-700 mt-1">{objective.value}</p>
								</div>
								
								<!-- Preconditions -->
								<div class="ml-4 space-y-3 mt-4">
									<div class="block text-sm font-semibold text-deep-teal">
										{preconditionsLabel}
									</div>
									
									{#each objective.preconditions as precondition, preconditionIndex}
										<div class="border border-deep-teal border-opacity-10 rounded p-3 bg-white">
											<div class="mb-2">
												<span class="text-xs font-medium text-deep-teal">
													{m.precondition()} {preconditionIndex + 1}:
												</span>
												<p class="text-gray-700 mt-1 text-sm">{precondition.value}</p>
											</div>
											
											<!-- Indicative Steps -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="block text-xs font-semibold text-deep-teal">
													{indicativeStepsLabel}
												</div>
												{#each precondition.indicativeSteps as step}
													<p class="text-gray-700 text-sm">{step.value}</p>
												{/each}
											</div>
											
											<!-- Key Indicators -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="block text-xs font-semibold text-deep-teal">
													{keyIndicatorsLabel}
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
					{/if}
					
					<!-- Functionalities -->
					{#if proposal.functionalities}
					<div>
						<label class="block text-lg font-semibold text-deep-teal mb-2">
							{m.functionalities()}
						</label>
						<div class="bg-gray-50 border border-deep-teal border-opacity-10 rounded p-4">
							<p class="text-gray-700 whitespace-pre-line">{proposal.functionalities}</p>
						</div>
					</div>
					{/if}
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
