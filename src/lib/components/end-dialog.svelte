<script lang="ts">
	import { Button } from './ui/button';
	import * as Dialog from './ui/dialog';
	import { m } from '@src/paraglide/messages';
	import { localizeHref } from '@src/paraglide/runtime';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import { GameState } from '@/state/game-state.svelte';
	import type { Player, PlayerAnswer } from '@/types';
	import { ROLES } from '@/types';
	import { CARDS } from '../data/cards';
	import { CHARACTER } from '../data/characters';
	import { goto } from '$app/navigation';
	import { Textarea } from './ui/textarea';
	import { supabase } from '@/supabase';
	import { getDiscussionMessages } from '@/utils/discussion-messages';

	let audio: HTMLAudioElement;
	onMount(() => {
		audio = new Audio(clickSound);
		audio.volume = 0.5;
	});

	interface EndDialogProps {
		open: boolean;
		gameState: GameState;
		discussionMessages?: Array<{
			id: string;
			content: string;
			senderType: 'human' | 'ai';
			senderName: string;
			round: number;
			timestamp: Date;
		}>;
		proposalId?: number | null;
	}

	let { open = $bindable(false), gameState, discussionMessages = [], proposalId = null }: EndDialogProps = $props();
	let currentPlayerId = $state(gameState?.playerId || -1);
	let discussionMessagesRound7 = $state<Array<{ senderName: string; content: string; timestamp: Date }>>([]);
	let vote = $state<'yes' | 'no' | 'abstain' | null>(null);

	const roleSet = new Set<string>(ROLES as unknown as string[]);

	function getBadgeSrc(characterType: string | null | undefined) {
		const type = characterType ?? 'custom';
		if (roleSet.has(type)) return `/images/characters/badges/roles/${type}.svg`;
		return `/images/characters/badges/${type}.svg`;
	}

	// Load discussion messages for round 7 when dialog opens
	$effect(() => {
		if (open && gameState) {
			const loadRound7Messages = async () => {
				try {
					const localRound7Messages = discussionMessages.filter(msg => msg.round === 7);
					if (localRound7Messages.length > 0) {
						discussionMessagesRound7 = localRound7Messages.map(msg => ({
							senderName: msg.senderType === 'human' ? 'You' : msg.senderName,
							content: msg.content,
							timestamp: msg.timestamp
						}));
						return;
					}

					const gameId = gameState.getGameId();
					if (gameId > 0) {
						const messages = await getDiscussionMessages(supabase, gameId, { round: 7 });
						discussionMessagesRound7 = messages.map(msg => ({
							senderName: msg.participantType === 'human' 
								? 'You' 
								: (msg.agentRole ? msg.agentRole.charAt(0).toUpperCase() + msg.agentRole.slice(1) : 'AI Agent'),
							content: msg.content,
							timestamp: new Date(msg.createdAt)
						}));
					}
				} catch (error) {
					console.error('Error loading round 7 discussion messages:', error);
				}
			};
			loadRound7Messages();
		}
	});

	// Format discussion messages for round 7 as a single text
	function formatRound7Discussion(): string {
		if (discussionMessagesRound7.length === 0) return '';
		return discussionMessagesRound7
			.map(msg => `${msg.senderName}: ${msg.content}`)
			.join('\n\n');
	}

	let storiesByPlayer = $derived.by(() => {
		const stories: Array<{ player: Player; answers: PlayerAnswer[]; isCurrent: boolean }> = [];

		if (!gameState) return [];
		const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);

		if (currentPlayer) {
			// Get all player answers and ensure we have entries for all 8 rounds (0-7)
			const playerAnswersMap = new Map<number, PlayerAnswer>();
			gameState.playersAnswers
				.filter((answer) => answer.player_id === currentPlayerId)
				.forEach((answer) => {
					playerAnswersMap.set(answer.round, answer);
				});

			// Create answers array with all 8 rounds, using discussion messages for round 7
			const playerAnswers: PlayerAnswer[] = Array.from({ length: 8 }, (_, i) => {
				if (i === 7 && discussionMessagesRound7.length > 0) {
					// For round 7, use discussion messages if available
					const existingAnswer = playerAnswersMap.get(7);
					return {
						id: existingAnswer?.id || 0,
						player_id: currentPlayerId,
						game_id: gameState.getGameId(),
						round: 7,
						answer: formatRound7Discussion()
					} as PlayerAnswer;
				} else {
					// For other rounds, use existing answer or create empty one
					const existingAnswer = playerAnswersMap.get(i);
					return existingAnswer || {
						id: 0,
						player_id: currentPlayerId,
						game_id: gameState.getGameId(),
						round: i,
						answer: ''
					} as PlayerAnswer;
				}
			});

			// Add current player as the first element
			stories.push({
				player: currentPlayer,
				answers: playerAnswers,
				isCurrent: true
			});
		}

		gameState.players
			.filter((player) => player.is_active !== false && player.id !== currentPlayerId)
			.forEach((player) => {
				// Get all player answers and ensure we have entries for all 8 rounds (0-7)
				const playerAnswersMap = new Map<number, PlayerAnswer>();
				gameState.playersAnswers
					.filter((answer) => answer.player_id === player.id)
					.forEach((answer) => {
						playerAnswersMap.set(answer.round, answer);
					});

				// Create answers array with all 8 rounds
				const playerAnswers: PlayerAnswer[] = Array.from({ length: 8 }, (_, i) => {
					const existingAnswer = playerAnswersMap.get(i);
					return existingAnswer || {
						id: 0,
						player_id: player.id,
						game_id: gameState.getGameId(),
						round: i,
						answer: ''
					} as PlayerAnswer;
				});

				stories.push({
					player,
					answers: playerAnswers,
					isCurrent: false
				});
			});
		return stories;
	});

	function getTranslation(key: string | null | undefined): string {
		if (!key) return ''; // Return an empty string if the key is undefined
		const translation = m[key as keyof typeof m];
		if (typeof translation === 'function') {
			return translation();
		} else {
			console.warn(`Translation for key "${key}" is missing or not a function.`);
			return 'Translation missing';
		}
	}

	function getCardText(playerId: number, round: number): string {
		if (!gameState) return '';

		const playerCardIds = gameState.playersCards.find(
			(card) => card.player_id === playerId && card.round === round
		);
		if (playerCardIds) {
			const card = gameState.cards.find((c) => c.id === playerCardIds.card_id);
			return card?.text ?? '';
		}
		return '';
	}
	function getCharacterName(characterType: string): string {
		// Find the character card with the matching type
		const characterCard = CHARACTER.find((char) => char.type === characterType);

		// If found, get the translated title
		if (characterCard?.title) {
			return getTranslation(characterCard.title);
		}

		// Fallback: return a formatted version of the type itself
		return characterType
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	interface ExpandedAnswersMap {
		[key: string]: boolean;
	}

	let expandedAnswers = $state<ExpandedAnswersMap>({});

	// Toggle expansion state for an answer
	function toggleAnswerExpansion(answerId: string) {
		expandedAnswers = {
			...expandedAnswers,
			[answerId]: !expandedAnswers[answerId]
		};
	}

	// Check if an answer is expanded
	function isAnswerExpanded(answerId: string): boolean {
		return !!expandedAnswers[answerId];
	}

	let playerName = $state('');
	let storyTitle = $state('');
	let isFormValid = $derived(vote !== null);

	$effect(() => {
		if (open && gameState) {
			const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
			playerName = currentPlayer?.nickname?.trim() || 'Participant';
			storyTitle = m.round_7_title();
		}
	});

	async function handleGameEnd() {
		audio.play();
		if (!vote) return;
		// Logic to save the story
		const discussionText = formatRound7Discussion();
		const id = await gameState.saveStory(playerName, storyTitle, discussionText, vote, proposalId);
		if (!id || id === false) {
			console.error('Failed to save discussion; no id returned.');
			return;
		}
		goto(localizeHref(`/stories/${id}`));
		// Reset the form
		playerName = '';
		storyTitle = '';
		vote = null;
	}

	let editMode = $state(false);
	let editingAnswerId = $state<string | null>(null);
	let editedContent = $state('');

	function startEditing(answer: PlayerAnswer) {
		if (!editMode) return;

		editingAnswerId = `${answer.player_id}-${answer.round}`;
		editedContent = answer.answer;
	}

	async function saveEdit(answer: PlayerAnswer) {
		if (!editingAnswerId || !editMode) return;

		if (answer) {
			try {
				// Call the gameState method to update the answer
				await gameState.updatePlayerAnswer(answer.id, editedContent);
			} catch (error) {
				console.error('Failed to save edit:', error);
			}
		}

		// Reset editing state
		editingAnswerId = null;
		editedContent = '';
		editMode = false;
	}

	function cancelEdit() {
		editMode = false;
		editingAnswerId = null;
		editedContent = '';
	}

	// Function to toggle edit mode
	function handleEdit(answer: PlayerAnswer) {
		audio.play();
		editMode = !editMode;
		if (editMode === false) {
			cancelEdit();
		} else {
			editMode = true;
			startEditing(answer);
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		interactOutsideBehavior="ignore"
		class="overflow-y-auto max-h-[96vh] sm:max-h-[80vh] w-[calc(100vw-2rem)] lg:max-w-4xl flex flex-col"
	>
		<div class="flex flex-col items-center justify-center gap-1">
			<p class="text-deep-teal rounded-full font-medium text-lg underline">{m.game_ended()}</p>
			<p class="text-deep-teal font-bold text-4xl text-center">{m.thanks_for_playing()}</p>
		</div>
		<div class="flex flex-col lg:flex-row gap-4 p-4 h-full">
			<div class="overflow-y-auto flex flex-col flex-grow w-full max-w-full sm:max-w-[75ch]">
				{#if Object.keys(storiesByPlayer).length > 0}
					<div class="space-y-8">
						{#each storiesByPlayer as playerData, index}
							<div
								class="border-2 {playerData.isCurrent
									? 'border-deep-teal'
									: 'border-gray-300'} rounded-lg overflow-hidden"
							>
								<h2 class="text-xl font-bold text-deep-teal p-2">
									{playerData.isCurrent ? m.your_story() : m.others_stories()}
								</h2>
								<div class="bg-gray-50 p-4 flex items-center gap-3 border-b">
									<div class="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
										<img
											src={getBadgeSrc(playerData.player.character)}
											alt={playerData.player.character ?? 'custom'}
											class="w-full h-full object-cover"
										/>
									</div>
									<div>
										<h3 class="font-bold text-2xl text-deep-teal">
											{playerData.player.nickname}
										</h3>
										<p class="text-sm text-gray-500 capitalize">
											{playerData.player.character
												? getCharacterName(playerData.player.character)
												: 'Unknown Character'}
										</p>
									</div>
								</div>

								<div class="flex flex-col items-start pointer w-full">
									{#each playerData.answers as answer}
										{#if playerData.isCurrent && editingAnswerId === `${answer.player_id}-${answer.round}`}
											<div class="w-full p-3 bg-gray-50 border-1 border-gray-300">
												<div class="flex gap-4 mb-2">
													{#if answer.round === 0}
														<div
															class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
														>
															<span>{m.intro()}</span>
														</div>
													{:else if answer.round === 7}
														<div
															class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
														>
															<span>{m.post_story()}</span>
														</div>
													{:else}
														<div
															class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
														>
															<span>{m.round()}</span>
															<span>{answer.round}</span>
														</div>
														<p class="text-sm text-gray-500 italic break-words whitespace-pre-wrap">
															"{getCardText(answer.player_id, answer.round)}"
														</p>
													{/if}
												</div>

												<Textarea
													bind:value={editedContent}
													class="w-full min-h-32 p-3 border-2 border-deep-teal rounded-md focus:ring-deep-teal focus:outline-none"
													placeholder="Edit your answer..."
												></Textarea>

												<div class="flex justify-end gap-2 mt-2">
													<Button variant="outline" size="default" onclick={cancelEdit}
														>{m.cancel()}</Button
													>
													<Button
														variant="default"
														size="default"
														onclick={() => saveEdit(answer)}
														data-answer-id={`${answer.player_id}-${answer.round}`}
													>
														{m.save()}
													</Button>
												</div>
											</div>
										{:else}
											<div class="w-full p-4 hover:bg-gray-100">
												<div class="flex justify-between gap-4">
													<button
														class="w-full text-left"
														onclick={() =>
															toggleAnswerExpansion(`${answer.player_id}-${answer.round}`)}
													>
														{#if isAnswerExpanded(`${answer.player_id}-${answer.round}`)}
															<div class="flex gap-4 mb-2 animate-fade-in">
																{#if answer.round === 0}
																	<div
																		class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
																	>
																		<span>{m.intro()}</span>
																	</div>
																{:else if answer.round === 7}
																	<div
																		class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
																	>
																		<span>{m.post_story()}</span>
																	</div>
																{:else}
																	<div
																		class="flex gap-1 items-start text-sm font-semibold text-deep-teal"
																	>
																		<span>{m.round()}</span>
																		<span>{answer.round}</span>
																	</div>
																	<p
																		class="text-sm text-gray-500 italic break-words whitespace-pre-wrap"
																	>
																		"{getCardText(answer.player_id, answer.round)}"
																	</p>
																{/if}
															</div>
														{/if}
														<p class="px-4 text-left w-full break-words whitespace-pre-wrap">
															{answer.answer}
														</p>
													</button>
													{#if playerData.isCurrent && editMode === false}
														<div class="align-self-end">
															<Button
																variant={editMode ? 'default' : 'outline'}
																size="default"
																class=""
																onclick={() => handleEdit(answer)}
															>
																{m.edit()}
															</Button>
														</div>
													{/if}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-gray-500">Error</p>
				{/if}
			</div>
			<div class="flex flex-col shrink-1 gap-4 min-h-full">
				<div class="flex flex-col gap-2">
					<p>{m.vote_prompt()}</p>
					<div class="flex items-center gap-2">
						<Button
							variant={vote === 'yes' ? 'default' : 'outline'}
							size="sm"
							onclick={() => (vote = 'yes')}
						>
							{m.vote_yes()}
						</Button>
						<Button
							variant={vote === 'no' ? 'default' : 'outline'}
							size="sm"
							onclick={() => (vote = 'no')}
						>
							{m.vote_no()}
						</Button>
						<Button
							variant={vote === 'abstain' ? 'default' : 'outline'}
							size="sm"
							onclick={() => (vote = 'abstain')}
						>
							{m.vote_abstain()}
						</Button>
					</div>
				</div>
				<Button
					class="p-2 flex"
					size="lg"
					onclick={handleGameEnd}
					disabled={!isFormValid}
				>
					{m.submit_discussion_and_vote()}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.animate-fade-in {
		animation: fadeIn 0.2s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
