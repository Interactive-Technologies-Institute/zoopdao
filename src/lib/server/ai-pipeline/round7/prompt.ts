import { buildNonHumanPromptProfile } from '$lib/server/ai-pipeline/prompts';
import type { BatchAgent } from './types';

function compact(value: string | null | undefined): string {
	return (value ?? '').replace(/\s+/g, ' ').trim();
}

function truncate(value: string | null | undefined, maxChars: number): string {
	const normalized = compact(value);
	if (!normalized) return '';
	return normalized.length <= maxChars ? normalized : normalized.slice(0, maxChars).trim();
}

function bulletList(items: string[], maxItems: number, maxChars: number): string[] {
	return items
		.slice(0, maxItems)
		.map((item) => truncate(item, maxChars))
		.filter(Boolean)
		.map((item) => `- ${item}`);
}

export function buildMinimalTextPrompt(params: {
	agent: BatchAgent;
	locale: string | null | undefined;
}): string {
	const profile = buildNonHumanPromptProfile({
		agentName: params.agent.name,
		agentRole: params.agent.role,
		locale: params.locale ?? null
	});
	const purpose = truncate(profile.policy.mission.purposeAndOverview, 500);
	const keyResponsibilities = bulletList(profile.policy.mission.keyResponsibilities, 5, 220);
	const operationalGuidelines = bulletList(profile.policy.mission.operationalGuidelines, 4, 220);
	const benefits = bulletList(profile.policy.mission.benefitsToOrganization, 4, 220);
	const conclusion = truncate(profile.policy.mission.conclusion, 260);
	const safetyRules = bulletList(profile.policy.safetyRules, 4, 180);
	const decisionHeuristics = bulletList(profile.policy.decisionHeuristics, 3, 180);
	const responseRules = bulletList(profile.policy.responseRules, 4, 180);

	return [
		'### Identity',
		`Role title: ${profile.identity.roleTitle}`,
		`Assistant: ${profile.identity.assistantName}`,
		`Organization: ${profile.identity.organization.full} (${profile.identity.organization.short})`,
		`Entity represented: ${profile.identity.nonHumanEntity}`,
		'',
		'### Mission',
		purpose ? `Purpose and Overview: ${purpose}` : null,
		keyResponsibilities.length ? 'Key Responsibilities:' : null,
		...keyResponsibilities,
		operationalGuidelines.length ? 'Operational Guidelines:' : null,
		...operationalGuidelines,
		benefits.length ? 'Benefits to Organization:' : null,
		...benefits,
		conclusion ? `Conclusion: ${conclusion}` : null,
		'',
		'### Policy',
		safetyRules.length ? 'Safety Rules:' : null,
		...safetyRules,
		decisionHeuristics.length ? 'Decision Heuristics:' : null,
		...decisionHeuristics,
		responseRules.length ? 'Response Rules:' : null,
		...responseRules,
		'',
		'### Task',
		'Reply in the EXACT same language as the latest user message.',
		'Answer the latest user message directly and concretely.',
		'If the latest user message is only a greeting, greet back and ask one concrete proposal question about this proposal.',
		'Use provided proposal context, discussion summary/history, and RAG context when relevant.',
		'Output exactly one sentence, no lists, no JSON, no agent-name prefix.'
	]
		.filter(Boolean)
		.join('\n');
}
