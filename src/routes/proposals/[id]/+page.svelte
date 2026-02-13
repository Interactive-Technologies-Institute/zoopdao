<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import { getLocale, localizeUrl } from '@src/paraglide/runtime.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { createAudio, playAudio } from '$lib/utils/sound';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let click_sound: HTMLAudioElement | null = null;

	onMount(() => {
		click_sound = createAudio(clickSound, 0.5);
	});

	const proposal = data.proposal;
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

	function handleBack() {
		playAudio(click_sound);
		goto(localizeUrl(`/proposals/${proposal.id}/preview`).toString());
	}
</script>

<div class="min-h-screen bg-[#efe7e2] bos-bg p-4">
	<div class="max-w-4xl mx-auto">
		<!-- Back Button -->
		<div class="mb-4">
			<Button variant="ghost" size="icon" onclick={handleBack} class="text-deep-teal">
				<ArrowLeft class="h-6 w-6" />
			</Button>
		</div>

		<!-- Proposal View -->
		<div class="bg-white rounded-lg border-2 border-deep-teal border-opacity-20 p-6 md:p-8">
			<h1 class="bos-title text-3xl font-bold text-deep-teal mb-6">{proposal.title}</h1>

			<!-- Theory of Change Section -->
			<div class="space-y-6">
				<h2 class="bos-title text-xl font-medium text-deep-teal">{proposalFormatLabel}</h2>

				<!-- Long-term Objectives -->
					<div class="space-y-4">
						<div class="bos-title block text-lg font-semibold text-deep-teal">
							{longTermObjectivesLabel}
						</div>

					{#each proposal.objectives as objective, objectiveIndex}
						<div class="border-2 border-deep-teal border-opacity-20 rounded-lg p-4 bg-gray-50">
							<div class="mb-3">
								<span class="bos-title text-sm font-medium text-deep-teal">
									{m.objective()}
									{objectiveIndex + 1}:
								</span>
								<p class="text-gray-700 mt-1">{objective.value}</p>
							</div>

							<!-- Preconditions -->
							<div class="ml-4 space-y-3 mt-4">
								<div class="bos-title block text-sm font-semibold text-deep-teal">
									{preconditionsLabel}
								</div>

								{#each objective.preconditions as precondition, preconditionIndex}
									<div class="border border-deep-teal border-opacity-10 rounded p-3 bg-white">
										<div class="mb-2">
											<span class="bos-title text-xs font-medium text-deep-teal">
												{m.precondition()}
												{preconditionIndex + 1}:
											</span>
											<p class="text-gray-700 mt-1 text-sm">{precondition.value}</p>
										</div>

										<!-- Indicative Steps -->
										<div class="ml-4 space-y-2 mt-3">
											<div class="bos-title block text-xs font-semibold text-deep-teal">
												{indicativeStepsLabel}
											</div>
											{#each precondition.indicativeSteps as step}
												<p class="text-gray-700 text-sm">{step.value}</p>
											{/each}
										</div>

										<!-- Key Indicators -->
										<div class="ml-4 space-y-2 mt-3">
											<div class="bos-title block text-xs font-semibold text-deep-teal">
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

				<!-- Functionalities -->
				<div>
					<label class="bos-title block text-lg font-semibold text-deep-teal mb-2">
						{m.functionalities()}
					</label>
					<div class="bg-gray-50 border border-deep-teal border-opacity-10 rounded p-4">
						<p class="text-gray-700 whitespace-pre-line">{proposal.functionalities}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
