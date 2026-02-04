<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Textarea } from '@/components/ui/textarea';
	import { Check, ChevronDown, ChevronUp, ChevronsUpDown, X } from 'lucide-svelte';
	import { Select } from 'bits-ui';
	import { m } from '@src/paraglide/messages';
	import { localizeUrl, getLocale } from '@src/paraglide/runtime.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { createAudio, playAudio } from '$lib/utils/sound';
	import { getVotingPeriods } from '$lib/data/voting-periods';

	// Theory of Change data structure
	type IndicativeStep = { id: string; value: string };
	type KeyIndicator = { id: string; value: string };
	type Precondition = {
		id: string;
		value: string;
		indicativeSteps: IndicativeStep[];
		keyIndicators: KeyIndicator[];
	};
	type Objective = {
		id: string;
		value: string;
		preconditions: Precondition[];
	};

	let click_sound: HTMLAudioElement | null = null;

	onMount(() => {
		click_sound = createAudio(clickSound, 0.5);
	});

	let title = $state('');
	let objectives = $state<Objective[]>([
		{
			id: '1',
			value: '',
			preconditions: Array(2)
				.fill(null)
				.map((_, i) => ({
					id: `1-${i + 1}`,
					value: '',
					indicativeSteps: [{ id: `1-${i + 1}-step-1`, value: '' }],
					keyIndicators: [{ id: `1-${i + 1}-indicator-1`, value: '' }]
				}))
		},
		{
			id: '2',
			value: '',
			preconditions: Array(2)
				.fill(null)
				.map((_, i) => ({
					id: `2-${i + 1}`,
					value: '',
					indicativeSteps: [{ id: `2-${i + 1}-step-1`, value: '' }],
					keyIndicators: [{ id: `2-${i + 1}-indicator-1`, value: '' }]
				}))
		}
	]);
	let functionalities = $state('');
	let votingPeriod = $state('');
	let proposalLanguage = $state(getLocale()); // Default to current locale

	// Get voting periods for current year only (excluding exceptional periods)
	const currentYear = new Date().getFullYear();
	const votingPeriods = getVotingPeriods(currentYear);
	const votingPeriodOptions = $derived.by(() =>
		votingPeriods.map((p) => ({ value: p.id, label: p.label }))
	);
	const votingPeriodLabel = $derived.by(
		() => votingPeriods.find((p) => p.id === votingPeriod)?.label ?? m.select_voting_period()
	);

	let functionalitiesRef: HTMLTextAreaElement | null = null;

	function autosizeFunctionalities() {
		if (!functionalitiesRef) return;
		functionalitiesRef.style.height = 'auto';
		functionalitiesRef.style.height = `${functionalitiesRef.scrollHeight}px`;
	}

	$effect(() => {
		functionalities;
		autosizeFunctionalities();
	});

	function validateForm(): boolean {
		if (!title.trim()) return false;
		if (objectives.length < 2) return false;
		for (const objective of objectives) {
			if (!objective.value.trim()) return false;
			if (objective.preconditions.length < 2) return false;
			for (const precondition of objective.preconditions) {
				if (!precondition.value.trim()) return false;
				if (precondition.indicativeSteps.length < 1) return false;
				for (const step of precondition.indicativeSteps) {
					if (!step.value.trim()) return false;
				}
				if (precondition.keyIndicators.length < 1) return false;
				for (const indicator of precondition.keyIndicators) {
					if (!indicator.value.trim()) return false;
				}
			}
		}
		if (!functionalities.trim()) return false;
		if (!votingPeriod) return false;
		return true;
	}

	function handleExit() {
		playAudio(click_sound);
		goto(localizeUrl('/'));
	}

	async function handleSubmit() {
		playAudio(click_sound);
		if (!validateForm()) {
			alert(m.form_validation_error());
			return;
		}

		try {
			const response = await fetch('/api/proposals', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					objectives,
					functionalities,
					voting_period_id: votingPeriod,
					language: proposalLanguage
				})
			});

			if (!response.ok) {
				const error = await response.json();
				alert(error.error || m.proposal_submission_error());
				return;
			}

			// Success - navigate back to homepage
			goto(localizeUrl('/'));
		} catch (error) {
			console.error('Error submitting proposal:', error);
			alert(m.proposal_submission_error());
		}
	}
</script>

<div class="min-h-screen bg-[#efe7e2] bos-bg p-4">
	<div class="max-w-4xl mx-auto">
		<!-- Exit Button -->
		<div class="flex justify-end mb-4">
			<Button variant="ghost" size="icon" onclick={handleExit} class="text-deep-teal">
				<X class="h-6 w-6" />
			</Button>
		</div>

		<!-- Form -->
		<div class="bg-white rounded-lg border-2 border-deep-teal border-opacity-20 p-6 md:p-8">
			<h1 class="bos-title text-3xl font-bold text-deep-teal">{m.new_proposal()}</h1>
			<p class="text-deep-teal/70 text-sm mt-1 mb-6">{m.theory_of_change()}</p>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-6"
			>
				<!-- Title Field -->
				<div>
					<label for="title" class="bos-title block text-sm font-medium text-deep-teal mb-2">
						{m.proposal_title()}
					</label>
					<Input
						id="title"
						type="text"
						bind:value={title}
						placeholder={m.proposal_title_placeholder()}
						required
						class="w-full"
					/>
				</div>

				<!-- Theory of Change Section -->
				<div class="space-y-6">
					<!-- Long-term Objectives -->
					<div class="space-y-4">
						<div class="bos-title block text-lg font-semibold text-deep-teal">
							{m.long_term_objectives()} <span class="text-red-500">*</span>
							<span class="text-sm font-normal text-gray-600 ml-2"
								>({m.long_term_objectives_description()})</span
							>
						</div>

						{#each objectives as objective, objectiveIndex}
							<div class="border-2 border-deep-teal border-opacity-20 rounded-lg p-4 bg-gray-50">
								<div class="flex items-start gap-2 mb-3">
									<span class="bos-title text-sm font-medium text-deep-teal mt-2">
										{m.objective()}
										{objectiveIndex + 1}:
									</span>
									<Input
										bind:value={objective.value}
										placeholder={m.objective_placeholder()}
										required
										class="flex-1"
									/>
								</div>

								<!-- Preconditions -->
								<div class="ml-4 space-y-3 mt-4">
									<div class="bos-title block text-sm font-semibold text-deep-teal">
										{m.preconditions_and_goals()} <span class="text-red-500">*</span>
										<span class="text-xs font-normal text-gray-600 ml-2"
											>({m.preconditions_and_goals_description()})</span
										>
									</div>

									{#each objective.preconditions as precondition, preconditionIndex}
										<div class="border border-deep-teal border-opacity-10 rounded p-3 bg-white">
											<div class="flex items-start gap-2 mb-2">
												<span class="bos-title text-xs font-medium text-deep-teal mt-2">
													{m.precondition()}
													{preconditionIndex + 1}:
												</span>
												<Input
													bind:value={precondition.value}
													placeholder={m.precondition_placeholder()}
													required
													class="flex-1"
												/>
											</div>

											<!-- Indicative Steps -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="bos-title block text-xs font-semibold text-deep-teal">
													{m.indicative_steps()} <span class="text-red-500">*</span>
												</div>
												{#each precondition.indicativeSteps as step}
													<Input
														bind:value={step.value}
														placeholder={m.step_placeholder()}
														required
														class="w-full text-sm"
													/>
												{/each}
											</div>

											<!-- Key Indicators -->
											<div class="ml-4 space-y-2 mt-3">
												<div class="bos-title block text-xs font-semibold text-deep-teal">
													{m.key_indicators()} <span class="text-red-500">*</span>
													<span class="text-xs font-normal text-gray-600 ml-2"
														>({m.key_indicators_description()})</span
													>
												</div>
												{#each precondition.keyIndicators as indicator}
													<Input
														bind:value={indicator.value}
														placeholder={m.indicator_placeholder()}
														required
														class="w-full text-sm"
													/>
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
						<label
							for="functionalities"
							class="bos-title block text-lg font-semibold text-deep-teal mb-2"
						>
							{m.functionalities()} <span class="text-red-500">*</span>
						</label>
						<Textarea
							id="functionalities"
							bind:value={functionalities}
							bind:ref={functionalitiesRef}
							oninput={autosizeFunctionalities}
							placeholder={m.functionalities_placeholder()}
							required
							rows={3}
							class="w-full min-h-24 max-h-72 overflow-y-auto resize-none"
						/>
					</div>
				</div>

				<!-- Voting Period Selection (placeholder for ZD-154) -->
				<div>
					<label for="votingPeriod" class="bos-title block text-sm font-medium text-deep-teal mb-2">
						{m.voting_period()}
					</label>
					<Select.Root
						type="single"
						value={votingPeriod}
						onValueChange={(v) => {
							votingPeriod = v;
						}}
						items={votingPeriodOptions}
					>
						<Select.Trigger
							id="votingPeriod"
							class="h-10 rounded-md border-gray-300 bg-white focus:ring-deep-teal focus:border-deep-teal focus:ring-1 outline-none inline-flex w-full select-none items-center border px-3 text-sm transition-colors"
							aria-label="Select a voting period"
						>
							<span class={`flex-1 truncate ${votingPeriod ? 'text-black' : 'text-gray-400'}`}>
								{votingPeriodLabel}
							</span>
							<ChevronsUpDown class="text-gray-300 ml-auto size-6" />
						</Select.Trigger>
						<Select.Portal>
							<Select.Content
								class="focus-override border-deep-teal bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-hidden z-50 max-h-[var(--bits-select-content-available-height)] w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] select-none rounded-xl border px-1 py-2 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
								sideOffset={10}
							>
								<Select.ScrollUpButton class="flex w-full items-center justify-center">
									<ChevronUp class="size-3" />
								</Select.ScrollUpButton>
								<Select.Viewport class="p-1">
									{#each votingPeriodOptions as option (option.value)}
										<Select.Item
											class="flex h-10 w-full cursor-pointer select-none items-center rounded-md px-3 text-sm outline-none transition-colors data-[highlighted]:bg-gray-100 data-[selected]:bg-deep-teal data-[selected]:text-white"
											value={option.value}
											label={option.label}
										>
											{#snippet children({ selected })}
												<span class="flex-1">{option.label}</span>
												{#if selected}
													<div class="ml-2">
														<Check aria-label="check" />
													</div>
												{/if}
											{/snippet}
										</Select.Item>
									{/each}
								</Select.Viewport>
								<Select.ScrollDownButton class="flex w-full items-center justify-center">
									<ChevronDown class="size-3" />
								</Select.ScrollDownButton>
							</Select.Content>
						</Select.Portal>
					</Select.Root>
				</div>

				<!-- Submit Button -->
				<div class="flex justify-end gap-4 pt-4">
					<Button type="button" variant="outline" onclick={handleExit}>
						{m.cancel()}
					</Button>
					<Button type="submit" size="lg">
						{m.submit_proposal()}
					</Button>
				</div>
			</form>
		</div>
	</div>
</div>
