export type ProposalLike = {
	title?: string | null;
	objectives?: unknown;
	functionalities?: string | null;
};

type ObjectiveLike = {
	value?: string;
	objective?: string;
	title?: string;
	name?: string;
	preconditions?: Array<{
		value?: string;
		precondition?: string;
		goal?: string;
		condition?: string;
		text?: string;
		indicativeSteps?: Array<{ value?: string }>;
		indicative_steps?: Array<{ value?: string; step?: string; text?: string; action?: string }>;
		steps?: Array<{ value?: string; step?: string; text?: string; action?: string }>;
		keyIndicators?: Array<{ value?: string }>;
		key_indicators?: Array<{ value?: string; indicator?: string; text?: string; metric?: string }>;
		indicators?: Array<{ value?: string; indicator?: string; text?: string; metric?: string }>;
	}>;
};

export function normalizeObjectives(objectives: unknown): ObjectiveLike[] {
	if (!objectives) return [];
	if (Array.isArray(objectives)) return objectives as ObjectiveLike[];
	if (typeof objectives === 'string') {
		try {
			const parsed = JSON.parse(objectives);
			return Array.isArray(parsed) ? (parsed as ObjectiveLike[]) : [];
		} catch {
			return [];
		}
	}
	return [];
}

function compactStrings(values: Array<string | null | undefined>): string[] {
	return values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

function valueFrom(obj: Record<string, unknown> | null | undefined, keys: string[]): string | null {
	if (!obj) return null;
	for (const key of keys) {
		const raw = obj[key];
		if (typeof raw === 'string' && raw.trim()) return raw.trim();
	}
	return null;
}

function collectObjectives(objectives: ObjectiveLike[]): string[] {
	return compactStrings(
		objectives.map((objective) => valueFrom(objective as Record<string, unknown>, [
			'value',
			'objective',
			'title',
			'name'
		]))
	);
}

function collectPreconditions(objectives: ObjectiveLike[]): string[] {
	return compactStrings(
		objectives
			.flatMap((objective) => objective.preconditions ?? [])
			.map((precondition) =>
				valueFrom(precondition as Record<string, unknown>, [
					'value',
					'precondition',
					'goal',
					'condition',
					'text'
				])
			)
	);
}

function collectIndicativeSteps(objectives: ObjectiveLike[]): string[] {
	const steps = objectives
		.flatMap((objective) => objective.preconditions ?? [])
		.flatMap((precondition) => precondition.indicativeSteps ?? precondition.indicative_steps ?? precondition.steps ?? []);

	return compactStrings(
		steps.map((step) =>
			valueFrom(step as Record<string, unknown>, ['value', 'step', 'text', 'action'])
		)
	);
}

function collectKeyIndicators(objectives: ObjectiveLike[]): string[] {
	const indicators = objectives
		.flatMap((objective) => objective.preconditions ?? [])
		.flatMap((precondition) => precondition.keyIndicators ?? precondition.key_indicators ?? precondition.indicators ?? []);

	return compactStrings(
		indicators.map((indicator) =>
			valueFrom(indicator as Record<string, unknown>, ['value', 'indicator', 'text', 'metric'])
		)
	);
}

export function getProposalPointsForRound(proposal: ProposalLike, roundIndex: number): string[] {
	const objectives = normalizeObjectives(proposal.objectives);

	const objectiveValues = collectObjectives(objectives);

	const preconditions = collectPreconditions(objectives);

	const indicativeSteps = collectIndicativeSteps(objectives);

	const keyIndicators = collectKeyIndicators(objectives);

	if (roundIndex === 0) return compactStrings([proposal.title ?? null]);
	if (roundIndex === 1) return objectiveValues[0] ? [objectiveValues[0]] : [];
	if (roundIndex === 2) return objectiveValues[1] ? [objectiveValues[1]] : [];
	if (roundIndex === 3) return preconditions;
	if (roundIndex === 4) return indicativeSteps;
	if (roundIndex === 5) return keyIndicators;
	if (roundIndex === 6) return compactStrings([proposal.functionalities ?? null]);
	return [];
}

export function getProposalTextForRound(proposal: ProposalLike, roundIndex: number): string {
	const points = getProposalPointsForRound(proposal, roundIndex);
	return points.length ? points.join('\n') : '';
}

export function getFullProposalText(proposal: ProposalLike): string {
	const parts: string[] = [];
	const title = (proposal.title ?? '').trim();
	if (title) parts.push(`Title:\n${title}`);

	const objectives = normalizeObjectives(proposal.objectives);
	const objectiveValues = collectObjectives(objectives);
	if (objectiveValues.length) parts.push(`Long-term objectives:\n${objectiveValues.join('\n')}`);

	const preconditions = collectPreconditions(objectives);
	if (preconditions.length) parts.push(`Preconditions and goals:\n${preconditions.join('\n')}`);

	const indicativeSteps = collectIndicativeSteps(objectives);
	if (indicativeSteps.length) parts.push(`Indicative steps:\n${indicativeSteps.join('\n')}`);

	const keyIndicators = collectKeyIndicators(objectives);
	if (keyIndicators.length) parts.push(`Key indicators:\n${keyIndicators.join('\n')}`);

	const functionalities = (proposal.functionalities ?? '').trim();
	if (functionalities) parts.push(`Functionalities:\n${functionalities}`);

	return parts.join('\n\n');
}

export function getProposalContextUpToRound(proposal: ProposalLike, roundIndex: number): string {
	const parts: string[] = [];
	const title = (proposal.title ?? '').trim();
	if (roundIndex >= 0 && title) parts.push(`Title:\n${title}`);

	const objectives = normalizeObjectives(proposal.objectives);
	const objectiveValues = collectObjectives(objectives);
	if (roundIndex >= 1 && objectiveValues.length) {
		parts.push(`Long-term objectives:\n${objectiveValues.join('\n')}`);
	}

	const preconditions = collectPreconditions(objectives);
	if (roundIndex >= 3 && preconditions.length) {
		parts.push(`Preconditions and goals:\n${preconditions.join('\n')}`);
	}

	const indicativeSteps = collectIndicativeSteps(objectives);
	if (roundIndex >= 4 && indicativeSteps.length) {
		parts.push(`Indicative steps:\n${indicativeSteps.join('\n')}`);
	}

	const keyIndicators = collectKeyIndicators(objectives);
	if (roundIndex >= 5 && keyIndicators.length) {
		parts.push(`Key indicators:\n${keyIndicators.join('\n')}`);
	}

	const functionalities = (proposal.functionalities ?? '').trim();
	if (roundIndex >= 6 && functionalities) {
		parts.push(`Functionalities:\n${functionalities}`);
	}

	return parts.join('\n\n');
}
