import speakerPromptConfig from '$lib/ai/nonhuman-speaker-prompt.json';
import { getAINonHumanPersonaByName } from '$lib/data/ai-nonhumans';
import type { AiAgentRole } from '$lib/ai/llm-types';
import { ORGANIZATION_FULL, ORGANIZATION_SHORT } from '$lib/config/organization';

const DEFAULT_NONHUMAN_ENTITY = 'non-human communities';

function normalizeInline(text: string): string {
	return text.replaceAll(/\s+/g, ' ').trim();
}

export function buildNonHumanSystemPrompt(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}): {
	systemPrompt: string;
	organizationName: string;
} {
	const persona = params.agentName ? getAINonHumanPersonaByName(params.agentName) : null;
	const usePt = (params.locale ?? '').toLowerCase().startsWith('pt');

	// The avatar's constituency ("cargo") is treated as the nonhuman entity it speaks for.
	const nonhumanEntityRaw = persona ? (usePt ? persona.cargoPt : persona.cargoEn) : DEFAULT_NONHUMAN_ENTITY;
	const nonhumanEntity = normalizeInline(nonhumanEntityRaw);

	const roleTitleTemplate = speakerPromptConfig.roleTitleTemplate.replaceAll('{ORG_SHORT}', ORGANIZATION_SHORT);
	const roleTitleEntity =
		nonhumanEntity.replace(new RegExp(`^${ORGANIZATION_SHORT}\\s+`, 'i'), '').trim() || nonhumanEntity;
	const resolvedRoleTitle = roleTitleTemplate.replaceAll('{NONHUMAN_ENTITY}', roleTitleEntity);

	const agentLine = persona
		? `You are ${persona.name}, representing ${nonhumanEntity}.`
		: params.agentName
			? `You are ${params.agentName}.`
			: `You are an AI agent participant (${params.agentRole}).`;

	const systemPrompt = speakerPromptConfig.systemPromptTemplate
		.replaceAll('{ORG_SHORT}', ORGANIZATION_SHORT)
		.replaceAll('{ORG_FULL}', ORGANIZATION_FULL)
		.replaceAll('{NONHUMAN_ENTITY}', nonhumanEntity)
		.replaceAll('{ROLE_TITLE}', resolvedRoleTitle)
		.replaceAll('{AGENT_LINE}', agentLine);

	return { systemPrompt, organizationName: ORGANIZATION_FULL };
}

export function buildAgentSystemPrompt(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}) {
	return buildNonHumanSystemPrompt(params);
}
