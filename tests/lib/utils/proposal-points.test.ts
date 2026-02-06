import { describe, expect, it } from 'vitest';
import { getFullProposalText, getProposalPointsForRound, getProposalTextForRound } from '../../../src/lib/utils/proposal-points';

describe('proposal-points', () => {
	it('maps rounds 0-6 to proposal points', () => {
		const proposal = {
			title: 'Save the Reef',
			objectives: [
				{
					value: 'Increase biodiversity',
					preconditions: [
						{
							value: 'Secure funding',
							indicativeSteps: [{ value: 'Apply for grants' }, { value: 'Partner with NGOs' }],
							keyIndicators: [{ value: 'Funds raised' }]
						}
					]
				},
				{
					value: 'Improve water quality',
					preconditions: [{ value: 'Upgrade filtration', indicativeSteps: [{ value: 'Install sensors' }], keyIndicators: [{ value: 'Nitrate levels' }] }]
				}
			],
			functionalities: 'Add monitoring dashboard'
		};

		expect(getProposalTextForRound(proposal, 0)).toBe('Save the Reef');
		expect(getProposalTextForRound(proposal, 1)).toBe('Increase biodiversity');
		expect(getProposalTextForRound(proposal, 2)).toBe('Improve water quality');
		expect(getProposalPointsForRound(proposal, 3)).toEqual(['Secure funding', 'Upgrade filtration']);
		expect(getProposalPointsForRound(proposal, 4)).toEqual([
			'Apply for grants',
			'Partner with NGOs',
			'Install sensors'
		]);
		expect(getProposalPointsForRound(proposal, 5)).toEqual(['Funds raised', 'Nitrate levels']);
		expect(getProposalTextForRound(proposal, 6)).toBe('Add monitoring dashboard');
	});

	it('handles objectives stored as JSON strings', () => {
		const objectives = JSON.stringify([{ value: 'Objective A' }]);
		const proposal = { title: 'T', objectives, functionalities: null };
		expect(getProposalTextForRound(proposal, 1)).toBe('Objective A');
	});

	it('supports legacy objective/precondition keys', () => {
		const proposal = {
			title: 'Legacy',
			objectives: [
				{
					objective: 'Legacy objective',
					preconditions: [
						{
							precondition: 'Legacy precondition',
							indicative_steps: [{ step: 'Legacy step' }],
							key_indicators: [{ indicator: 'Legacy indicator' }]
						}
					]
				}
			]
		};

		expect(getProposalTextForRound(proposal, 1)).toBe('Legacy objective');
		expect(getProposalTextForRound(proposal, 3)).toBe('Legacy precondition');
		expect(getProposalTextForRound(proposal, 4)).toBe('Legacy step');
		expect(getProposalTextForRound(proposal, 5)).toBe('Legacy indicator');
	});

	it('builds a full proposal text block', () => {
		const proposal = {
			title: 'Example',
			objectives: [{ value: 'Obj', preconditions: [{ value: 'Pre', indicativeSteps: [{ value: 'Step' }], keyIndicators: [{ value: 'KPI' }] }] }],
			functionalities: 'Func'
		};

		const full = getFullProposalText(proposal);
		expect(full).toContain('Title:');
		expect(full).toContain('Long-term objectives:');
		expect(full).toContain('Preconditions and goals:');
		expect(full).toContain('Indicative steps:');
		expect(full).toContain('Key indicators:');
		expect(full).toContain('Functionalities:');
	});
});
