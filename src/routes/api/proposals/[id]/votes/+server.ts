import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { getExceptionalVotingPeriods, getProposalStatus, getVotingPeriods } from '$lib/data/voting-periods';
import { supabase } from '$lib/supabase';
import type { Database } from '$lib/supabase-types.gen';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';

type VoteChoice = 'yes' | 'no' | 'abstain';
type VoteContext = 'preview' | 'discussion';

function getClient(accessToken?: string) {
	if (!accessToken) return supabase;

	return createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	});
}

function parseId(idParam: string) {
	const id = parseInt(idParam, 10);
	return Number.isNaN(id) ? null : id;
}

async function getUserId(accessToken?: string) {
	if (!accessToken) return null;
	const client = getClient(accessToken);
	const { data, error } = await client.auth.getUser(accessToken);
	if (error || !data?.user) return null;
	return data.user.id;
}

async function getTallies(client: ReturnType<typeof getClient>, proposalId: number) {
	// Aggregate client-side to avoid PostgREST aggregate restrictions
	const { data, error } = await client
		.from('proposal_votes')
		.select('choice')
		.eq('proposal_id', proposalId);

	if (error) throw error;

	const base = { yes: 0, no: 0, abstain: 0 };
	const totals = (data || []).reduce<typeof base>((acc, row) => {
		const choice = row.choice as VoteChoice;
		return { ...acc, [choice]: (acc[choice] ?? 0) + 1 };
	}, base);

	const totalVotes = totals.yes + totals.no + totals.abstain;
	return { totals, totalVotes };
}

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const proposalId = parseId(params.id);
		if (!proposalId) {
			return json({ error: 'Invalid proposal ID' }, { status: 400 });
		}

		const authHeader = request.headers.get('authorization');
		const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
		const client = getClient(accessToken);
		const userId = await getUserId(accessToken);

		const { totals, totalVotes } = await getTallies(client, proposalId);

		let userVote: { choice: VoteChoice; context: VoteContext } | null = null;
		if (userId) {
			const { data: voteRow, error: voteErr } = await client
				.from('proposal_votes')
				.select('choice, context')
				.eq('proposal_id', proposalId)
				.eq('user_id', userId)
				.single();

			if (!voteErr && voteRow) {
				userVote = {
					choice: voteRow.choice as VoteChoice,
					context: voteRow.context as VoteContext
				};
			}
		}

		return json(
			{
				totals,
				totalVotes,
				userChoice: userVote?.choice ?? null,
				userContext: userVote?.context ?? null
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error('Error fetching votes:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const proposalId = parseId(params.id);
		if (!proposalId) {
			return json({ error: 'Invalid proposal ID' }, { status: 400 });
		}

		const body = await request.json().catch(() => null);
		const choice: VoteChoice | undefined = body?.choice;
		const context: VoteContext | undefined = body?.context;

		if (!choice || !['yes', 'no', 'abstain'].includes(choice)) {
			return json({ error: 'Invalid choice' }, { status: 400 });
		}
		if (!context || !['preview', 'discussion'].includes(context)) {
			return json({ error: 'Invalid context' }, { status: 400 });
		}

		const authHeader = request.headers.get('authorization');
		const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
		const userId = await getUserId(accessToken);

		if (!userId) {
			return json({ error: 'Missing user session' }, { status: 401 });
		}

		const client = getClient(accessToken);

		// Ensure proposal exists and period is open
		const { data: proposal, error: proposalError } = await client
			.from('proposals')
			.select('voting_period_id')
			.eq('id', proposalId)
			.single();

		if (proposalError || !proposal) {
			return json({ error: 'Proposal not found' }, { status: 404 });
		}

		const currentYear = new Date().getFullYear();
		const periodSet = [...getVotingPeriods(currentYear), ...getExceptionalVotingPeriods()];
		const status = getProposalStatus(proposal.voting_period_id, periodSet);
		if (status !== 'open') {
			return json({ error: 'Voting closed' }, { status: 400 });
		}

		const { error: insertError } = await client.from('proposal_votes').insert({
			proposal_id: proposalId,
			user_id: userId,
			choice,
			context
		});

		if (insertError) {
			if ((insertError as any).code === '23505') {
				return json({ error: 'Duplicate vote' }, { status: 409 });
			}
			console.error('Error inserting vote:', insertError);
			return json({ error: 'Failed to save vote' }, { status: 500 });
		}

		const { totals, totalVotes } = await getTallies(client, proposalId);

		return json(
			{
				totals,
				totalVotes,
				userChoice: choice,
				userContext: context
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Error saving vote:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
