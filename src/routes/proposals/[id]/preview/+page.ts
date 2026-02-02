import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getVotingPeriods, getExceptionalVotingPeriods, getProposalStatus } from '$lib/data/voting-periods';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const proposalId = params.id;
		
		// Fetch proposal
		const response = await fetch(`/api/proposals/${proposalId}`);
		if (!response.ok) {
			return error(404, { message: 'Proposal not found' });
		}
		
		const { proposal } = await response.json();
		
		// Get voting periods to determine status
		const currentYear = new Date().getFullYear();
		const allPeriods = [...getVotingPeriods(currentYear), ...getExceptionalVotingPeriods()];
		const status = getProposalStatus(proposal.voting_period_id, allPeriods);

		// Serialize dates for the client
		const serializedPeriods = allPeriods.map(p => ({
			...p,
			startDate: p.startDate.toISOString(),
			endDate: p.endDate.toISOString()
		}));

		// Fetch vote tallies (user-specific info fetched client-side)
		let votes = { totals: { yes: 0, no: 0, abstain: 0 }, totalVotes: 0, userChoice: null, userContext: null };
		try {
			const votesRes = await fetch(`/api/proposals/${proposalId}/votes`);
			if (votesRes.ok) {
				votes = await votesRes.json();
			}
		} catch (e) {
			console.warn('Unable to fetch votes during load', e);
		}
		
		return {
			proposal,
			status,
			allPeriods: serializedPeriods,
			votes
		};
	} catch (err) {
		console.error('Error loading proposal preview:', err);
		return error(500, { message: 'Failed to load proposal' });
	}
};
