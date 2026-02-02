<script lang="ts">
	import { Button } from '@/components/ui/button';
	import RelativeTime from './relative-time.svelte';
	import { Share2, Check, FileText, User } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { m } from '@src/paraglide/messages';
	import { localizeHref } from '@src/paraglide/runtime';
	import { getLocale } from '@src/paraglide/runtime';
	import type { StoryRound } from '$lib/types';
	import ProposalDialog from '@/components/proposal-dialog.svelte';

	let { data } = $props();
	const buttonColor = {
		landmark: 'bg-dark-deep',
		nature: 'bg-sea-green',
		sense: 'bg-sand',
		history: 'bg-sand',
		action: 'bg-driftwood'
	} as const;

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

	function getRoleLabel(): string {
		const type = data.character?.type;
		if (type) {
			const roleKey = `character_${type}_title`;
			const translated = getTranslation(roleKey);
			if (translated && translated !== 'Translation missing') return translated;
			// Fallback if i18n key isn't present
			return type
				.split('-')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ');
		}
		const fallback = (data.character?.nickname ?? '').trim();
		return fallback.length > 0 ? fallback : '-';
	}

	function getVoteLabel(vote: string | null | undefined): string {
		if (!vote) return '-';
		if (vote === 'yes') return m.vote_yes();
		if (vote === 'no') return m.vote_no();
		if (vote === 'abstain') return m.vote_abstain();
		return vote;
	}

	let isCopied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;
	let openProposalDialog = $state(false);
	const hasProposal = $derived.by(() => data.proposal_id !== null && data.proposal_id !== undefined);

	async function copyToClipboard() {
		const baseUrl = window.location.origin;
		const storyUrl = `${baseUrl}/stories/${data.story_id}`;
		await navigator.clipboard.writeText(storyUrl);

		// Set copied state
		isCopied = true;

		// Clear any existing timeout
		if (copyTimeout) clearTimeout(copyTimeout);

		// Reset after 2 seconds
		copyTimeout = setTimeout(() => {
			isCopied = false;
		}, 2000);
	}

	// Cleanup timeout on component destroy
	onDestroy(() => {
		if (copyTimeout) clearTimeout(copyTimeout);
	});
</script>

<div
	class="flex flex-col md:flex-row min-w-full h-full gap-4 items-stretch justify-between p-4 border-2 border-deep-teal rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out"
>
	<div class="flex flex-col items-center justify-center p-4">
		<!-- Match the user badge styling used during the live discussion -->
		<div class="h-32 w-32 rounded-full border-4 border-black bg-gray-200 flex items-center justify-center">
			<User class="h-16 w-16 text-gray-600" />
		</div>
	</div>
	<div class="flex flex-1 flex-col gap-4 w-full justify-between">
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap gap-4 items-start justify-between">
				<p class="text-deep-teal font-bold text-2xl text-ellipsis line-clamp-3">
					{data.proposal_title ?? data.story_title}
				</p>
				<RelativeTime date={data.created_at} />
			</div>
			<div class="flex flex-col gap-1">
				<p>
					<span class="text-gray-500">{getLocale() === 'pt' ? 'Cargo' : 'Role'}:</span>
					<span class="font-bold"> {getRoleLabel()}</span>
				</p>
				<p>
					<span class="text-gray-500">{getLocale() === 'pt' ? 'Voto final' : 'Final vote'}:</span>
					<span class="font-bold"> {getVoteLabel(data.vote ?? null)}</span>
				</p>
			</div>
		</div>
		<div class="flex flex-col lg:flex-row justify-between gap-4">
			<div class="flex flex-wrap items-center gap-1">
				{#each [...new Set((Object.values(data.rounds) as StoryRound[])
							.map((round) => round.type)
							.filter((type): type is keyof typeof buttonColor => type !== null && type in buttonColor))] as type}
					<span
						class="capitalize inline-block px-4 py-2 text-xs rounded-md {buttonColor[
							type
						]} text-white"
					>
						{getTranslation(`${type}_type`)}
					</span>
				{/each}
			</div>
			<div class="flex gap-2 items-center self-end">
				<Button variant={'outline'} onclick={copyToClipboard} class="transition-all duration-200">
					{#if isCopied}
						<Check class="w-4 h-4 mr-2" /> {m.copied()}
					{:else}
						<Share2 class="w-4 h-4 mr-2" /> {m.share()}
					{/if}
				</Button>
				<Button href={localizeHref(`/stories/${data.story_id}`)}>{m.read_more()}</Button>
			</div>
		</div>
	<button
		class="w-full mt-2 px-4 py-3 text-left rounded-lg border-2 border-deep-teal border-opacity-20 bg-white hover:bg-tertiary/40 transition-colors text-deep-teal font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
		onclick={() => (openProposalDialog = true)}
		disabled={!hasProposal}
		aria-disabled={!hasProposal}
	>
			<FileText class="h-4 w-4" />
			{m.view_full_proposal()}
		</button>
	</div>
</div>

<ProposalDialog bind:open={openProposalDialog} proposalId={data.proposal_id ?? null} />
