import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';
import type { SavedDiscussion, SavedStory } from '$lib/types';

const ITEMS_PER_PAGE = 5;

const mapDiscussionToStory = (
	discussion: SavedDiscussion,
	proposalTitleById: Map<number, string>
): SavedStory => ({
	id: discussion.id,
	story_id: discussion.discussion_id,
	created_at: discussion.created_at,
	proposal_id: discussion.proposal_id,
	proposal_title:
		typeof discussion.proposal_id === 'number'
			? proposalTitleById.get(discussion.proposal_id) ?? null
			: null,
	player_name: discussion.player_name,
	story_title: discussion.discussion_title,
	character: discussion.character,
	rounds: discussion.rounds,
	card_types: discussion.card_types,
	full_story: discussion.full_discussion,
	vote: discussion.vote
});

export const load = (async ({ url }) => {
	// Get all query parameters with explicit null checks
	const page = url.searchParams.has('page') ? parseInt(url.searchParams.get('page')!) : 1;
	const search = url.searchParams.get('search') ?? '';
	const character = url.searchParams.get('character') ?? '';
	const proposalIdRaw = url.searchParams.get('proposalId');
	const proposalId = proposalIdRaw ? parseInt(proposalIdRaw) : null;
	const sort = url.searchParams.get('sort') ?? 'latest';

	// Start building the query
	let query = supabase.from('saved_discussions').select('*', { count: 'exact' });
	query = query.eq('public_discussion', true);

	if (search.trim()) {
		const searchTerms = search
			.trim()
			.split(/\s+/)
			.filter((term) => term.length > 0);

		// Build search conditions using FTS for character_search and ILIKE for other fields
		const searchConditions = [
			...searchTerms.map((term) => `player_name.ilike.%${term}%`),
			...searchTerms.map((term) => `discussion_title.ilike.%${term}%`),
			...searchTerms.map((term) => `character_search.fts.${term}`),
			...searchTerms.map((term) => `full_discussion.ilike.%${term}%`)
		].join(',');

		query = query.or(searchConditions);
	}

	if (character.trim()) {
		query = query.eq('character->>type', character);
	}

	if (proposalId && !Number.isNaN(proposalId)) {
		query = query.eq('proposal_id', proposalId);
	}

	// Calculate pagination
	const from = (page - 1) * ITEMS_PER_PAGE;
	const to = from + ITEMS_PER_PAGE - 1;

	// Get paginated results
	const {
		data: discussions,
		error,
		count
	} = await query.order('created_at', { ascending: sort === 'oldest' }).range(from, to);

	if (error) {
		console.error('Error loading stories:', error);
		return {
			stories: [],
			totalPages: 0,
			currentPage: 1,
			totalStories: 0,
			proposals: [],
			filters: {
				search,
				character,
				proposalId,
				sort
			}
		};
	}

	// For display: show proposal titles on story cards instead of the generic discussion title.
	const pageProposalIds = Array.from(
		new Set(
			(discussions || [])
				.map((d) => d.proposal_id)
				.filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
		)
	);

	const proposalTitleById = new Map<number, string>();
	if (pageProposalIds.length > 0) {
		const { data: pageProposals, error: pageProposalsError } = await supabase
			.from('proposals')
			.select('id, title')
			.in('id', pageProposalIds);

		if (pageProposalsError) {
			console.warn('Error loading proposal titles for stories:', pageProposalsError);
		} else {
			for (const p of pageProposals || []) {
				proposalTitleById.set(p.id, p.title);
			}
		}
	}

	// Used by the UI proposal filter. Keep it small and recent.
	// Only show proposals that already have at least one public discussion.
	const { data: proposalRefs, error: refsError } = await supabase
		.from('saved_discussions')
		.select('proposal_id, created_at')
		.eq('public_discussion', true)
		.not('proposal_id', 'is', null)
		.order('created_at', { ascending: false })
		.limit(200);

	if (refsError) {
		console.warn('Error loading proposal refs:', refsError);
	}

	const uniqueProposalIds: number[] = [];
	const seen = new Set<number>();
	for (const row of proposalRefs || []) {
		const id = row.proposal_id as unknown as number | null;
		if (typeof id !== 'number') continue;
		if (seen.has(id)) continue;
		seen.add(id);
		uniqueProposalIds.push(id);
		if (uniqueProposalIds.length >= 12) break;
	}

	let proposals: Array<{ id: number; title: string }> = [];
	if (uniqueProposalIds.length > 0) {
		const { data: proposalRows, error: proposalsError } = await supabase
			.from('proposals')
			.select('id, title')
			.in('id', uniqueProposalIds);

		if (proposalsError) {
			console.warn('Error loading proposals list:', proposalsError);
		} else {
			const order = new Map<number, number>(uniqueProposalIds.map((id, idx) => [id, idx]));
			proposals = (proposalRows || [])
				.slice()
				.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
		}
	}

	return {
		stories: (discussions || []).map((d) => mapDiscussionToStory(d, proposalTitleById)),
		totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
		currentPage: page,
		totalStories: count || 0,
		proposals: proposals || [],
		filters: {
			search,
			character,
			proposalId,
			sort
		}
	};
}) satisfies PageLoad;
