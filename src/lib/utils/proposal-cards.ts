import type { Card } from '$lib/types';

const PROPOSAL_CARD_TYPES: Record<number, Card['type']> = {
	0: 'nature',
	1: 'sense',
	2: 'sense',
	3: 'history',
	4: 'action',
	5: 'landmark',
	6: 'history'
};

export function getProposalCardType(roundIndex: number): Card['type'] {
	return PROPOSAL_CARD_TYPES[roundIndex] ?? 'nature';
}
