<script lang="ts">
	import type { GameState } from '@/state/game-state.svelte';
	import Card from './card.svelte';
	import { Button } from './ui/button';
	import * as Dialog from './ui/dialog';
	import Textarea from './ui/textarea/textarea.svelte';
	import CharacterCard from './character-card.svelte';
	import { m } from '@src/paraglide/messages';
	import { getLocale } from '@src/paraglide/runtime.js';
	import { ROUNDS } from '../data/rounds';
	import { onMount } from 'svelte';
	import paperSound from '@/sounds/rustling-paper.mp3';
	import clickSound from '@/sounds/ui-click.mp3';
	import { createAudio, playAudio } from '$lib/utils/sound';
	import { Flag, FileText } from 'lucide-svelte';
	import Timer from './timer.svelte';
	import PostStory from './post-story-icon.svelte';
	import { getCharacterCategory, type Card as CardData, type Character } from '@src/lib/types';
	import SpeciesInfoDialog from './species-info-dialog.svelte';
	import ProposalDialog from '@/components/proposal-dialog.svelte';
	import { ZOOP_THEME_ASSET_PREFIX } from '$lib/config/theme';
	import { getProposalCardType } from '$lib/utils/proposal-cards';

	let audio: HTMLAudioElement | null = null;
	let click_sound: HTMLAudioElement | null = null;

	onMount(() => {
		click_sound = createAudio(clickSound, 0.5);
		audio = createAudio(paperSound, 0.5);
	});
	interface StoryDialogProps {
		open: boolean;
		gameState: GameState;
		proposalId?: number | null;
	}

	let { open = $bindable(false), gameState, proposalId = null }: StoryDialogProps = $props();
	let openProposalDialog = $state(false);
	let proposal = $state<any>(null);

	async function fetchProposal() {
		if (!proposalId) {
			proposal = null;
			return;
		}

		try {
			const response = await fetch(`/api/proposals/${proposalId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch proposal');
			}
			const { proposal: proposalData } = await response.json();
			if (proposalData?.objectives && typeof proposalData.objectives === 'string') {
				try {
					proposalData.objectives = JSON.parse(proposalData.objectives);
				} catch (parseError) {
					console.error('Error parsing objectives:', parseError);
				}
			}
			proposal = proposalData;
		} catch (error) {
			console.error('Failed to load proposal:', error);
			proposal = null;
		}
	}

	$effect(() => {
		if (open) {
			fetchProposal();
		} else {
			proposal = null;
		}
	});

	let currentRound = $derived.by(() => {
		// Use gameState.currentRound directly, but ensure it's a number
		const round = gameState.currentRound;
		return typeof round === 'number' ? round : 0;
	});

	let sortedRounds = $derived.by(() => {
		if (!gameState.rounds || gameState.rounds.length === 0) {
			console.warn('No rounds found in gameState.rounds:', gameState.rounds);
			return [];
		}
		const sorted = [...gameState.rounds].sort((a, b) => a.index - b.index);
		console.log('Sorted rounds:', sorted);
		return sorted;
	});

	let player = $derived.by(() => {
		return gameState.players.find((player) => player.id === gameState.playerId);
	});

	function normalizeObjectives(objectives: unknown) {
		if (!objectives) return [];
		if (Array.isArray(objectives)) return objectives;
		if (typeof objectives === 'string') {
			try {
				return JSON.parse(objectives);
			} catch {
				return [];
			}
		}
		return [];
	}

	const objectives = $derived.by(() => normalizeObjectives(proposal?.objectives));
	const objectiveValues = $derived.by(() =>
		objectives
			.map((objective: { value?: string }) => objective.value)
			.filter((value: string | undefined): value is string => !!value)
	);
	const preconditions = $derived.by(() =>
		objectives
			.flatMap(
				(objective: { preconditions?: { value?: string }[] }) => objective.preconditions ?? []
			)
			.map((precondition) => precondition.value)
			.filter((value: string | undefined): value is string => !!value)
	);
	const indicativeSteps = $derived.by(() =>
		objectives
			.flatMap(
				(objective: { preconditions?: { indicativeSteps?: { value?: string }[] }[] }) =>
					objective.preconditions ?? []
			)
			.flatMap((precondition) => precondition.indicativeSteps ?? [])
			.map((step) => step.value)
			.filter((value: string | undefined): value is string => !!value)
	);
	const keyIndicators = $derived.by(() =>
		objectives
			.flatMap(
				(objective: { preconditions?: { keyIndicators?: { value?: string }[] }[] }) =>
					objective.preconditions ?? []
			)
			.flatMap((precondition) => precondition.keyIndicators ?? [])
			.map((indicator) => indicator.value)
			.filter((value: string | undefined): value is string => !!value)
	);

	function getProposalPointsForRound(roundIndex: number): string[] {
		if (!proposal) return [];
		if (roundIndex === 0) return proposal.title ? [proposal.title] : [];
		if (roundIndex === 1) return objectiveValues[0] ? [objectiveValues[0]] : [];
		if (roundIndex === 2) return objectiveValues[1] ? [objectiveValues[1]] : [];
		if (roundIndex === 3) return preconditions;
		if (roundIndex === 4) return indicativeSteps;
		if (roundIndex === 5) return keyIndicators;
		if (roundIndex === 6) return proposal.functionalities ? [proposal.functionalities] : [];
		return [];
	}

	function getProposalTextForRound(roundIndex: number): string {
		const points = getProposalPointsForRound(roundIndex);
		if (points.length === 0) return '';
		return points.join('\n');
	}

	function getFallbackCardType(roundIndex: number): CardData['type'] {
		return getProposalCardType(roundIndex);
	}

	function buildProposalCard(roundIndex: number, text: string): CardData & { assetType?: string } {
		return {
			id: -roundIndex,
			type: getFallbackCardType(roundIndex),
			title: getTranslation(ROUNDS[roundIndex]?.title),
			text,
			assetType: roundIndex === 6 ? 'functionality' : undefined,
			hero_steps: [],
			character_category: ['human']
		};
	}
	$effect(() => {
		if (open && playerState === 'writing') {
			// Start timer only when dialog is actually open
			// Use setTimeout to ensure dialog is fully rendered before starting timer
			setTimeout(() => {
				const currentGameRound = gameState.gameRounds.find((r) => r.round === currentRound);
				if (currentGameRound && !currentGameRound.timer_duration) {
					gameState.startRoundTimer();
				}
			}, 100);

			playAudio(audio);
			setTimeout(() => {
				const round = document.getElementById(`round-${currentRound}`);
				if (round) {
					round.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 100); // Ensures DOM updates before scrolling
		}
	});

	let playerAnswers = $derived.by(() => {
		return gameState.playersAnswers.filter((answer) => answer.player_id === gameState.playerId);
	});
	let currentAnswer = $state('');

	async function submitAnswer() {
		if (playerState === 'writing') {
			// Check if there's only one human player
			const humanPlayers = gameState.players.filter((p) => p.is_active !== false);
			const isSinglePlayer = humanPlayers.length === 1;
			const currentRoundBefore = gameState.currentRound;

			if (currentAnswer.trim() === '') {
				await gameState.submitAnswer(
					getLocale() === 'pt' ? '(Submissão vazia)' : '(Empty submission)'
				);
				alert(
					getLocale() === 'pt'
						? 'Não escreveste nada nesta ronda! Podes editar a tua discussão no final da participação.'
						: "You didn't write anything for this round! You can edit your discussion at the end of the participation."
				);
			} else {
				await gameState.submitAnswer(currentAnswer);
			}

			// If single player, wait for the round to advance
			if (isSinglePlayer) {
				// Wait for the database to process the answer and check round completion
				// check_round_completion will call roll_dice which creates a new game_round
				// The subscription will pick up the new round automatically
				let attempts = 0;
				const maxAttempts = 10; // Wait up to 2 seconds (10 * 200ms)

				while (attempts < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, 200));

					// Check if the round has advanced
					if (gameState.currentRound > currentRoundBefore) {
						console.log('Round advanced from', currentRoundBefore, 'to', gameState.currentRound);
						break;
					}

					attempts++;
				}

				// If round didn't advance, log for debugging
				if (gameState.currentRound === currentRoundBefore) {
					console.warn(
						'Round did not advance after submit. Current round:',
						gameState.currentRound
					);
				}
			}

			open = false;
			currentAnswer = '';
		}
	}

	function onSubmit() {
		playAudio(click_sound);
		submitAnswer();
	}

	function getTranslation(key: string | null | undefined): string {
		if (!key) return ''; // Return an empty string if the key is undefined
		const translation = m[key as keyof typeof m];
		if (typeof translation === 'function') {
			try {
				// Try calling without arguments first (for simple translations)
				return (translation as () => string)();
			} catch {
				// If that fails, try with empty object (for translations with parameters)
				try {
					return (translation as (params: { nickname: string }) => string)({ nickname: '' });
				} catch {
					return 'Translation missing';
				}
			}
		} else {
			console.warn(`Translation for key "${key}" is missing or not a function.`);
			return 'Translation missing';
		}
	}

	function handleTimeUp() {
		submitAnswer();
	}

	let playerState = $derived.by(() => {
		const state = gameState.playersState[gameState.playerId];
		return state?.state || 'starting';
	});

	let showSpeciesDialog = $state(false);
	function isNonHumanCharacter(character: Character | null | undefined): boolean {
		if (!character) return false;
		const category = getCharacterCategory(character);
		return category === 'non-human';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		interactOutsideBehavior="ignore"
		class="overflow-y-auto flex flex-col gap-y-10 max-h-[95vh] w-[95vw] md:w-[60dvw] bg-white rounded-2xl shadow-lg pb-80 md:pb-5"
		style="transform-origin: center center; z-index: 100;"
	>
		{#if sortedRounds.length === 0}
			<div class="p-8 text-center">
				<p class="text-gray-500">
					{getLocale() === 'pt'
						? 'Não há rondas disponíveis. Verifica se as rondas estão carregadas na base de dados.'
						: 'No rounds available. Please check if rounds are loaded in the database.'}
				</p>
			</div>
		{:else}
			{#each sortedRounds as round (round.index)}
				{@const answer = playerAnswers.find((answer) => answer.round === round.index)}
				{@const proposalText = getProposalTextForRound(round.index)}
				{@const displayCard = proposalText ? buildProposalCard(round.index, proposalText) : null}
				{@const isCurrentRound = round.index === currentRound}
				{@const isFutureRound = round.index > (currentRound ?? -1)}
				<div
					id={`round-${round.index}`}
					class="flex flex-col items-center lg:flex-row lg:items-stretch gap-8 w-full {round.index >
					(currentRound ?? -1)
						? 'opacity-30 grayscale'
						: ''}"
				>
					<div class="shrink-0 flex flex-col items-stretch">
						{#if round.index === 0}
							{#if displayCard}
								<Card card={displayCard} />
							{:else}
								<CharacterCard character={player?.character ?? 'child'} />
							{/if}
							{#if player && isNonHumanCharacter(player.character)}
								<Button variant="outline" class="mt-2" onclick={() => (showSpeciesDialog = true)}
									>{getLocale() === 'pt'
										? 'Saber mais sobre a tua personagem'
										: 'Learn more about your character'}</Button
								>
								<SpeciesInfoDialog
									bind:open={showSpeciesDialog}
									character={player?.character ?? 'child'}
								/>
							{/if}
						{:else if round.index === 7}
							<div
								class="w-64 h-96 bg-white rounded-xl bg-center border-2 border-gray-400/50 relative"
								style={`background-image: url('${ZOOP_THEME_ASSET_PREFIX}/cards/post-story.svg');`}
							>
								<div
									class="absolute inset-0 pb-32 px-4 flex flex-col justify-end text-center gap-3"
								>
									<h3 class={`text-2xl font-bold text-white`}>{m.post_story()}</h3>
									<p class="text-xs font-medium">{m.write_post_story()}</p>
								</div>
							</div>
						{:else if displayCard}
							<Card card={displayCard} />
						{:else}
							<div
								class="w-64 h-96 rounded-lg border-black border-dashed border-2 flex items-center justify-center"
							>
								<p class="text-sm text-center">{m.card_not_selected()}</p>
							</div>
						{/if}
						{#if isCurrentRound}
							<Button
								variant="outline"
								class="mt-2 w-full flex items-center justify-center gap-2 hover:bg-tertiary/40"
								onclick={() => (openProposalDialog = true)}
								disabled={!proposalId}
							>
								<FileText class="h-4 w-4" />
								{m.view_full_proposal()}
							</Button>
						{/if}
					</div>
					<div class="flex flex-col items-stretch w-full">
						<div class="flex items-center gap-2">
							{#if round.index === 0}
								<div
									class="w-8 h-8 rounded-full bg-[#FF6157] bos-accent-bg grid place-items-center"
								>
									<Flag class="w-4 h-4 text-white flex items-center justify-center" />
								</div>
							{:else if round.index === 7}
								<div
									class="w-8 h-8 rounded-full grid place-items-center {isFutureRound
										? 'bg-red-500'
										: 'bg-deep-teal'}"
								>
									<div class="w-4 h-4 flex items-center justify-center">
										<PostStory color={'white'} />
									</div>
								</div>
							{:else}
								<div
									class="w-8 h-8 rounded-full grid place-items-center {isFutureRound
										? 'bg-red-500'
										: 'bg-deep-teal'}"
								>
									<span
										class="text-white font-medium text-center text-base flex items-center justify-center"
										>{round.index}</span
									>
								</div>
							{/if}
							<p class="text-xl font-bold text-deep-teal">
								{getTranslation(ROUNDS[round.index].title)}
							</p>
						</div>
						<p class="font-medium py-1">
							{getTranslation(ROUNDS[round.index].description)}
						</p>
						{#if round.index === currentRound && playerState === 'writing'}
							<div class="flex-1 relative mb-4">
								<Textarea class="min-h-64 h-full mt-2" bind:value={currentAnswer} />
							</div>
							<div class=" flex items-center justify-between gap-3 bg-white">
								{#if open && playerState === 'writing' && gameState.mode === 'pedagogic'}
									<Timer
										onTimeUp={handleTimeUp}
										duration={gameState.getTimerDurationForRound(currentRound)}
									/>
								{/if}
								<Button onclick={onSubmit}>{m.submit()}</Button>
							</div>
						{:else}
							<Textarea class="min-h-64 flex-1 mt-2" value={answer?.answer ?? ''} disabled />
						{/if}
					</div>
				</div>
				{#if round.index !== 7}
					<div class="h-0.5 border-t-2 border-gray-200"></div>
				{/if}
			{/each}
		{/if}
	</Dialog.Content>
</Dialog.Root>

<ProposalDialog bind:open={openProposalDialog} {proposalId} />
