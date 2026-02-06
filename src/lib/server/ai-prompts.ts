import speakerPromptConfig from '$lib/ai/nonhuman-speaker-prompt.json';
import { getAINonHumanPersonaByName } from '$lib/data/ai-nonhumans';
import type { AiAgentRole } from '$lib/ai/llm-types';

// Role prompts for each AI agent role (adds perspective on top of the nonhuman system prompt).
export const ROLE_SYSTEM_PROMPTS: Record<AiAgentRole, string> = {
	administration: `Role perspective (Administration):
- Organizational operations and policy management
- Administrative processes and efficiency
- Strategic planning and coordination
- Resource allocation and management
- Compliance and regulatory considerations

You provide structured input considering administrative feasibility, resources, and organizational impact.`,

	research: `Role perspective (Research):
- Scientific research and studies
- Marine life and ecosystem knowledge
- Evidence-based decision making
- Data analysis and interpretation
- Long-term scientific implications

You contribute insights based on scientific knowledge and evidence and highlight uncertainties when data is missing.`,

	reception: `Role perspective (Reception):
- Visitor experience and engagement
- Front desk operations and customer service
- Public communication and information sharing
- Visitor feedback and needs
- Accessibility and inclusivity

You emphasize how proposals affect visitors, clarity of communication, and day-to-day interactions.`,

	operations: `Role perspective (Operations):
- Technical operations (electricity, plumbing)
- Facility maintenance and infrastructure
- Operational feasibility and technical requirements
- Safety and technical standards
- Practical implementation challenges

You focus on feasibility, maintenance, safety, and practical constraints.`,

	bar: `Role perspective (Bar):
- Food & beverage operations
- Visitor hospitality and service quality
- Revenue and business operations
- Food safety and service standards
- Visitor satisfaction

You consider service quality, food safety, and practical operations and tradeoffs.`,

	cleaning: `Role perspective (Cleaning):
- Hygiene and cleanliness standards
- Health and safety through cleanliness
- Practical cleaning operations
- Environmental hygiene considerations

You focus on hygiene, health, operational practicality, and maintaining standards.`
};

export function buildNonHumanSystemPrompt(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
}): {
	systemPrompt: string;
	organizationName: string;
} {
	const orgShort = speakerPromptConfig.organization.short;
	const orgFull = speakerPromptConfig.organization.full;
	const nonhumanEntity = speakerPromptConfig.nonhumanEntity;
	const roleTitle = speakerPromptConfig.roleTitleTemplate
		.replaceAll('{ORG_SHORT}', orgShort)
		.replaceAll('{NONHUMAN_ENTITY}', nonhumanEntity);

	const persona = params.agentName ? getAINonHumanPersonaByName(params.agentName) : null;
	const agentLine = persona
		? `You are ${persona.name}, representing ${persona.cargoEn}.`
		: params.agentName
			? `You are ${params.agentName}.`
			: `You are an AI agent participant (${params.agentRole}).`;

	const systemPrompt = speakerPromptConfig.systemPromptTemplate
		.replaceAll('{ORG_SHORT}', orgShort)
		.replaceAll('{ORG_FULL}', orgFull)
		.replaceAll('{NONHUMAN_ENTITY}', nonhumanEntity)
		.replaceAll('{ROLE_TITLE}', roleTitle)
		.replaceAll('{AGENT_LINE}', agentLine);

	return { systemPrompt, organizationName: orgFull };
}

export function buildAgentSystemPrompt(params: { agentName?: string | null; agentRole: AiAgentRole }) {
	const base = buildNonHumanSystemPrompt(params);
	const rolePrompt = ROLE_SYSTEM_PROMPTS[params.agentRole];
	return {
		organizationName: base.organizationName,
		systemPrompt: `${base.systemPrompt}\n\n${rolePrompt}`.trim()
	};
}

