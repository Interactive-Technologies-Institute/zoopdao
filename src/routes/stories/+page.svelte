<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';

	import { Select, Pagination } from 'bits-ui';
	import {
		Check,
		ChevronDown,
		ChevronUp,
		ChevronsUpDown,
		X,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	import { Button } from '@/components/ui/button';
	import { CHARACTER_OPTIONS } from '@/types';
	import type { CardType } from '@/types';
	import { m } from '@src/paraglide/messages';
	import StoryCard from '@/components/story-card.svelte';
	import { getLocale, localizeUrl } from '../../paraglide/runtime.js';

	const buttonColor = {
		landmark: 'bg-dark-deep',
		nature: 'bg-sea-green',
		sense: 'bg-sand',
		history: 'bg-sand',
		action: 'bg-driftwood'
	} as const;

	function formatCharacterLabel(type: string): string {
		const key = `character_${type}_title` as keyof typeof m;
		const translation = m[key];
		if (typeof translation === 'function') {
			return translation();
		}
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	const characterOptions = $derived.by(() => {
		const all = { value: '', label: getLocale() === 'pt' ? 'Todos' : 'All' };
		const other = { value: 'custom', label: getLocale() === 'pt' ? 'Outro' : 'Other' };

		const items = CHARACTER_OPTIONS.map((type) => ({
			value: type,
			label: formatCharacterLabel(type)
		}))
			// Alphabetical by label; keep "Outro" separate at the end.
			.slice()
			.sort((a, b) =>
				a.label.localeCompare(b.label, getLocale() === 'pt' ? 'pt-PT' : 'en', {
					sensitivity: 'base'
				})
			);

		return [all, ...items, other];
	});

	let sortOptions = [
		{ value: 'latest', label: m.latest_first() },
		{ value: 'oldest', label: m.oldest_first() }
	];

	const modeOptions = $derived.by(() => [
		{ value: '', label: getLocale() === 'pt' ? 'Todos' : 'All' },
		{ value: 'pedagogic', label: m.pedagogic_mode() },
		{ value: 'decision_making', label: m.decision_making_mode() }
	]);
	let { data } = $props();
	const stories = $derived(data.stories);
	const proposals = $derived(data.proposals ?? []);

	let value = $state(page.url.searchParams.get('character') || '');
	let selectedProposalId = $state(page.url.searchParams.get('proposalId') || '');
	let selectedMode = $state(page.url.searchParams.get('mode') || '');
	let currentPage = $state(parseInt(page.url.searchParams.get('page') ?? '1'));
	let sort = $state(page.url.searchParams.get('sort') || 'latest');
	const perPage = 5;
	const selectedLabel = $derived.by(
		() => characterOptions.find((option) => option.value === value)?.label
	);
	const selectedModeLabel = $derived(
		modeOptions.find((option) => option.value === selectedMode)?.label
	);
	let loading = $state(false);

	function formatProposalLabel(title: string): string {
		const words = title.trim().split(/\s+/).filter(Boolean);
		const short = words.slice(0, 3).join(' ');
		return words.length > 3 ? `${short}…` : short;
	}

	function toggleProposalId(id: number) {
		const str = String(id);
		selectedProposalId = selectedProposalId === str ? '' : str;
		currentPage = 1;
	}
	let searchTimeout: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (searchTimeout) clearTimeout(searchTimeout);

		// Debounce navigation when filters change (search disabled on purpose).
		// Compare against the current URL to avoid no-op navigations.
		const params = new URLSearchParams();
		if (value) params.set('character', value);
		if (selectedProposalId) params.set('proposalId', selectedProposalId);
		if (selectedMode) params.set('mode', selectedMode);
		if (sort) params.set('sort', sort);
		if (currentPage) params.set('page', currentPage.toString());

		const next = params.toString();
		const current = page.url.searchParams.toString();
		if (next === current) return;

		searchTimeout = setTimeout(async () => {
			loading = true;
			try {
				await goto(`?${next}`, { replaceState: true });
			} finally {
				loading = false;
			}
		}, 250);
	});

	async function handleClearFilters() {
		value = '';
		selectedProposalId = '';
		selectedMode = '';
		currentPage = 1;
		sort = 'latest';
		const url = new URL(page.url);
		url.searchParams.delete('character');
		url.searchParams.delete('proposalId');
		url.searchParams.delete('mode');
		await goto(url);
	}
</script>

<div class="flex flex-col p-6 md:p-24 mx-auto">
	<div class="flex items-start">
		<Button class="p-0 text-lg gap-1" variant={'ghost'} href={localizeUrl('/')}
			><ChevronLeft strokeWidth={4} size={32} absoluteStrokeWidth={true} />
			{m.back_to_game()}</Button
		>
	</div>

	<div class="flex flex-col gap-1">
		<h1 class="text-4xl font-bold text-deep-teal mt-4">{m.player_stories()}</h1>
		<p class="text-sm text-deep-teal">{m.explore_stories()}</p>
	</div>

	<div class="flex flex-wrap gap-3 mt-8 items-start">
		<div class="flex flex-col items-center gap-2 w-[calc(50%-0.375rem)] min-w-0 md:w-auto">
			<p class="self-start text-deep-teal text-sm font-medium">{m.filter_by_character()}</p>
			<Select.Root
				type="single"
				onValueChange={(v) => {
					value = v;
					currentPage = 1;
				}}
				items={characterOptions}
			>
				<Select.Trigger
					class="h-10 w-full rounded-md border-gray-300 bg-white focus:ring-deep-teal focus:border-deep-teal focus:ring-1 outline-none inline-flex select-none items-center border px-3 text-sm transition-colors"
					aria-label="Select a character"
				>
					<span class={`flex-1 truncate ${value ? 'text-black' : 'text-gray-400'}`}>
						{selectedLabel}
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
							{#each characterOptions as option, i (i + option.value)}
								<Select.Item
									class="flex h-10 w-full cursor-pointer select-none items-center rounded-md px-3 text-sm outline-none transition-colors  data-[highlighted]:bg-gray-100 data-[selected]:bg-deep-teal data-[selected]:text-white"
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
		<div class="flex flex-col items-center gap-2 w-[calc(50%-0.375rem)] min-w-0 md:w-auto">
			<p class="self-start text-deep-teal text-sm font-medium">
				{getLocale() === 'pt' ? 'Filtrar por modo' : 'Filter by mode'}
			</p>
			<Select.Root
				type="single"
				value={selectedMode}
				onValueChange={(v) => {
					selectedMode = v;
					currentPage = 1;
				}}
				items={modeOptions}
			>
				<Select.Trigger
					class="h-10 w-full rounded-md border-gray-300 bg-white focus:ring-deep-teal focus:border-deep-teal focus:ring-1 outline-none inline-flex select-none items-center border px-3 text-sm transition-colors"
					aria-label="Select a mode"
				>
					<span class={`flex-1 truncate ${selectedMode ? 'text-black' : 'text-gray-400'}`}>
						{selectedModeLabel}
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
							{#each modeOptions as option (option.value)}
								<Select.Item
									class="flex h-10 w-full cursor-pointer select-none items-center rounded-md px-3 text-sm outline-none transition-colors  data-[highlighted]:bg-gray-100 data-[selected]:bg-deep-teal data-[selected]:text-white"
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
		<div class="flex flex-col items-center gap-2 h-full w-full md:w-auto">
			<p class="self-start text-deep-teal text-sm font-medium">{m.filter_by_card()}</p>
			<div class="h-full flex flex-wrap gap-2">
				{#each proposals as p (p.id)}
					<button
						class="flex gap-1 items-center justify-center h-10 px-3 text-sm rounded-md transition-colors {selectedProposalId ===
						String(p.id)
							? `bg-deep-teal text-white`
							: ` bg-gray-200 text-gray-500`}"
						onclick={() => toggleProposalId(p.id)}
						title={p.title}
					>
						{#if selectedProposalId === String(p.id)}
							<Check class="w-4 h-4 text-white" />
						{/if}
						{formatProposalLabel(p.title)}
					</button>
				{/each}
			</div>
		</div>
		{#if value || selectedProposalId || selectedMode}
			<div class="self-end w-full md:w-auto">
				<Button
					class="flex items-center h-10 font-normal"
					variant="outline"
					onclick={handleClearFilters}
				>
					<span class="flex items-center gap-2">
						<X />
						<span>{m.clear_all()}</span>
					</span></Button
				>
			</div>
		{/if}
	</div>

	<div class="flex flex-col mt-8 gap-3">
		<div class="flex flex-wrap items-center justify-end gap-2">
			<div class="flex items-center gap-2">
				<p class="font-medium text-sm whitespace-nowrap">{m.sort_by()}</p>
				<Select.Root
					type="single"
					value={sort}
					onValueChange={(v) => (sort = v)}
					items={sortOptions}
				>
					<Select.Trigger
						class="h-10 rounded-md border-gray-300 bg-white focus:ring-deep-teal focus:border-deep-teal focus:ring-1 outline-none inline-flex w-36 lg:w-48 select-none items-center border px-3 text-sm transition-colors"
						aria-label="Sort stories"
					>
						<span>{sortOptions.find((opt) => opt.value === sort)?.label}</span>
						<ChevronsUpDown class="text-gray-300 ml-auto size-6" />
					</Select.Trigger>
					<Select.Portal>
						<Select.Content
							class="focus-override border-deep-teal bg-white z-50 min-w-[var(--bits-select-anchor-width)] select-none rounded-xl border px-1 py-3"
							sideOffset={10}
						>
							<Select.Viewport class="p-1">
								{#each sortOptions as option (option.value)}
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
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>
		</div>
		<div class="min-h-[200px]">
			<!-- Adjust height based on your needs -->
			{#if loading}
				<div class="flex items-center justify-center h-full">
					<!-- You can add a spinner here if you want -->
					<p class="text-deep-teal text-opacity-60">Loading stories...</p>
				</div>
			{:else if stories.length === 0}
				<div class="flex items-center justify-center h-full">
					<p class="font-medium text-gray-500">No stories found.</p>
				</div>
			{:else}
				<div class="flex flex-wrap gap-4">
					{#each stories as story (story.story_id)}
						<StoryCard data={story} />
					{/each}
				</div>
			{/if}
		</div>
		<div class="self-center">
			<Pagination.Root count={data.totalStories} {perPage} bind:page={currentPage}>
				{#snippet children({ pages, range })}
					<div class="my-8 flex flex-wrap items-center justify-center gap-2 max-w-full px-1">
						<Pagination.PrevButton
							class="hover:bg-gray-200 disabled:text-gray-400 sm:mr-[25px] inline-flex gap-1 items-center justify-center rounded-lg bg-transparent active:scale-[0.98] disabled:cursor-not-allowed hover:disabled:bg-transparent p-2"
						>
							<ChevronLeft />
							<span class="hidden sm:inline">{m.previous()}</span>
						</Pagination.PrevButton>
						<div class="flex items-center justify-center flex-wrap gap-2.5">
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<div class="select-none font-medium">...</div>
								{:else}
									<Pagination.Page
										{page}
										class="hover:bg-gray-200 data-[selected]:bg-deep-teal data-[selected]:text-white inline-flex size-9 sm:size-10 select-none items-center justify-center rounded-lg bg-transparent font-medium active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-transparent"
									>
										{page.value}
									</Pagination.Page>
								{/if}
							{/each}
						</div>
						<Pagination.NextButton
							class="hover:bg-gray-200 disabled:text-gray-400 sm:ml-[25px] inline-flex gap-1 items-center justify-center rounded-lg bg-transparent active:scale-[0.98] disabled:cursor-not-allowed hover:disabled:bg-transparent p-2"
						>
							<span class="hidden sm:inline">{m.next()}</span>
							<ChevronRight />
						</Pagination.NextButton>
					</div>
					<p class="text-gray-400 text-center text-sm">
						Showing {range.start + 1} - {range.end}
					</p>
				{/snippet}
			</Pagination.Root>
		</div>
	</div>
</div>
