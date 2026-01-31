import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isProposalOpen, type VotingPeriod } from '../../../src/lib/data/voting-periods';

describe('isProposalOpen', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const periods: VotingPeriod[] = [
		{
			id: 'test-period',
			label: 'Test Period',
			startDate: new Date(2026, 0, 1),
			endDate: new Date(2026, 0, 31)
		}
	];

	it('includes the first day of the voting period', () => {
		vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0, 0));
		expect(isProposalOpen('test-period', periods)).toBe(true);
	});

	it('includes the last day of the voting period', () => {
		vi.setSystemTime(new Date(2026, 0, 31, 12, 0, 0, 0));
		expect(isProposalOpen('test-period', periods)).toBe(true);
	});

	it('excludes dates before the voting period', () => {
		vi.setSystemTime(new Date(2025, 11, 31, 23, 59, 59, 999));
		expect(isProposalOpen('test-period', periods)).toBe(false);
	});

	it('excludes dates after the voting period', () => {
		vi.setSystemTime(new Date(2026, 1, 1, 0, 0, 0, 0));
		expect(isProposalOpen('test-period', periods)).toBe(false);
	});
});
