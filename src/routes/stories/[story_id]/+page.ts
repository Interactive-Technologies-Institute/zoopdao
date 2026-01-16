import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';
import type { SavedDiscussion, SavedStory } from '$lib/types';
import { error } from '@sveltejs/kit';
import { getLocale } from '@src/paraglide/runtime.js';

const mapDiscussionToStory = (discussion: SavedDiscussion): SavedStory => ({
	id: discussion.id,
	story_id: discussion.discussion_id,
	created_at: discussion.created_at,
	proposal_id: discussion.proposal_id,
	player_name: discussion.player_name,
	story_title: discussion.discussion_title,
	character: discussion.character,
	rounds: discussion.rounds,
	card_types: discussion.card_types,
	full_story: discussion.full_discussion,
	vote: discussion.vote
});

export const load = (async ({ params }) => {
	const { data: discussion, error: err } = await supabase
		.from('saved_discussions')
		.select('*')
		.eq('discussion_id', params.story_id)
		.single<SavedDiscussion>();

	if (err) {
		throw error(404, 'Story not found');
	}

	// Extract card_ids from rounds
	const story = mapDiscussionToStory(discussion);
	const rounds = story.rounds;
	const cardIds = Object.values(rounds)
		.map((r: any) => r.card_id)
		.filter((id: number | null) => typeof id === 'number' && id !== null);

	const currentLang = getLocale();

	let cards = [];
	if (cardIds.length > 0) {
		const { data: cardData, error: cardError } = await supabase
			.from('cards')
			.select(
				`
                id,
                type,
                title,
                prompt_text(text, lang)
            `
			)
			.in('id', cardIds);

		if (cardError) {
			throw error(500, 'Could not load card info');
		}
		// Flatten text from prompt_text, prefer current locale but fall back to first entry
		cards = cardData.map((card) => {
			const promptTexts = card.prompt_text ?? [];
			const localized = promptTexts.find((prompt: { lang?: string }) => prompt.lang === currentLang);
			const fallback = promptTexts[0];
			return {
				...card,
				text: localized?.text ?? fallback?.text ?? ''
			};
		});
	}

	let proposal = null;
	if (discussion.proposal_id) {
		const { data: proposalData, error: proposalError } = await supabase
			.from('proposals')
			.select('id, title, objectives, functionalities, discussion')
			.eq('id', discussion.proposal_id)
			.single();

		if (!proposalError) {
			proposal = proposalData;
		}
	}

	return {
		story,
		cards,
		proposal
	};
}) satisfies PageLoad;
