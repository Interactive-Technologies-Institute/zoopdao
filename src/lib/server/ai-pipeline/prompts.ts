import speakerPromptConfig from '$lib/ai/nonhuman-speaker-prompt.json';
import { getAINonHumanPersonaByName } from '$lib/data/ai-nonhumans';
import type { AiAgentRole } from '$lib/ai/llm-types';
import { ORGANIZATION_FULL, ORGANIZATION_SHORT } from '$lib/config/organization';

const DEFAULT_NONHUMAN_ENTITY = 'non-human communities';

function normalizeInline(text: string): string {
	return text.replaceAll(/\s+/g, ' ').trim();
}

type PromptSection = { title?: string; textTemplate?: string };
type PromptSectionItem = { id?: string; title?: string; textTemplate?: string };

export type NonHumanPromptProfile = {
	identity: {
		assistantName: string;
		roleTitle: string;
		organization: {
			short: string;
			full: string;
		};
		nonHumanEntity: string;
	};
	policy: {
		mission: {
			purposeAndOverview: string;
			keyResponsibilities: string[];
			operationalGuidelines: string[];
			benefitsToOrganization: string[];
			conclusion: string;
		};
		safetyRules: string[];
		decisionHeuristics: string[];
		responseRules: string[];
	};
};

function applyTokens(template: string, replacements: Record<string, string>): string {
	let resolved = template;
	for (const [token, value] of Object.entries(replacements)) {
		resolved = resolved.replaceAll(`{${token}}`, value);
	}
	return resolved;
}

function resolvePromptIdentity(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}) {
	const persona = params.agentName ? getAINonHumanPersonaByName(params.agentName) : null;
	const usePt = (params.locale ?? '').toLowerCase().startsWith('pt');
	const nonhumanEntityRaw = persona ? (usePt ? persona.cargoPt : persona.cargoEn) : DEFAULT_NONHUMAN_ENTITY;
	const nonHumanEntity = normalizeInline(nonhumanEntityRaw);

	const roleTitleTemplate = speakerPromptConfig.roleTitleTemplate.replaceAll('{ORG_SHORT}', ORGANIZATION_SHORT);
	const roleTitleEntity =
		nonHumanEntity.replace(new RegExp(`^${ORGANIZATION_SHORT}\\s+`, 'i'), '').trim() || nonHumanEntity;
	const roleTitle = roleTitleTemplate.replaceAll('{NONHUMAN_ENTITY}', roleTitleEntity);

	const assistantNameTemplate = speakerPromptConfig.assistantNameTemplate || "{ORG_SHORT} {NONHUMAN_ENTITY}'s Speaker for the Living";
	const assistantName = applyTokens(assistantNameTemplate, {
		ORG_SHORT: ORGANIZATION_SHORT,
		ORG_FULL: ORGANIZATION_FULL,
		NONHUMAN_ENTITY: roleTitleEntity,
		ROLE_TITLE: roleTitle
	});

	const agentLine = persona
		? `You are ${persona.name}, representing ${nonHumanEntity}.`
		: params.agentName
			? `You are ${params.agentName}.`
			: `You are an AI agent participant (${params.agentRole}).`;

	return {
		nonHumanEntity,
		roleTitle,
		assistantName,
		agentLine
	};
}

function getResolvedSectionText(section: PromptSection | undefined, replacements: Record<string, string>): string {
	const template = section?.textTemplate ?? '';
	return template ? applyTokens(template, replacements) : '';
}

function getResolvedList(items: PromptSectionItem[] | undefined, replacements: Record<string, string>): string[] {
	if (!Array.isArray(items)) return [];
	return items
		.map((item) => {
			const body = item?.textTemplate ? applyTokens(item.textTemplate, replacements) : '';
			if (!body) return '';
			return item?.title ? `${item.title}: ${body}` : body;
		})
		.filter(Boolean);
}

export function buildNonHumanPromptProfile(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}): NonHumanPromptProfile {
	const identity = resolvePromptIdentity(params);
	const replacements = {
		ORG_SHORT: ORGANIZATION_SHORT,
		ORG_FULL: ORGANIZATION_FULL,
		NONHUMAN_ENTITY: identity.nonHumanEntity,
		ROLE_TITLE: identity.roleTitle
	};
	const sections = speakerPromptConfig.systemPromptOriginalTemplate?.sections;

	return {
		identity: {
			assistantName: identity.assistantName,
			roleTitle: identity.roleTitle,
			organization: {
				short: ORGANIZATION_SHORT,
				full: ORGANIZATION_FULL
			},
			nonHumanEntity: identity.nonHumanEntity
		},
		policy: {
			mission: {
				purposeAndOverview: getResolvedSectionText(sections?.purposeAndOverview as PromptSection, replacements),
				keyResponsibilities: getResolvedList(sections?.keyResponsibilities as PromptSectionItem[], replacements),
				operationalGuidelines: getResolvedList(sections?.operationalGuidelines as PromptSectionItem[], replacements),
				benefitsToOrganization: getResolvedList(sections?.benefitsToOrganization as PromptSectionItem[], replacements),
				conclusion: getResolvedSectionText(sections?.conclusion as PromptSection, replacements)
			},
			safetyRules: Array.isArray(speakerPromptConfig.extensions?.safetyRules)
				? speakerPromptConfig.extensions.safetyRules.map((rule) => applyTokens(String(rule), replacements))
				: [],
			decisionHeuristics: Array.isArray(speakerPromptConfig.extensions?.decisionHeuristics)
				? speakerPromptConfig.extensions.decisionHeuristics.map((rule) => applyTokens(String(rule), replacements))
				: [],
			responseRules: Array.isArray(speakerPromptConfig.extensions?.responseRules)
				? speakerPromptConfig.extensions.responseRules.map((rule) => applyTokens(String(rule), replacements))
				: []
		}
	};
}

export function buildNonHumanSystemPrompt(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}): {
	systemPrompt: string;
	organizationName: string;
} {
	const identity = resolvePromptIdentity(params);

	const systemPrompt = speakerPromptConfig.systemPromptTemplate
		.replaceAll('{ORG_SHORT}', ORGANIZATION_SHORT)
		.replaceAll('{ORG_FULL}', ORGANIZATION_FULL)
		.replaceAll('{NONHUMAN_ENTITY}', identity.nonHumanEntity)
		.replaceAll('{ROLE_TITLE}', identity.roleTitle)
		.replaceAll('{AGENT_LINE}', identity.agentLine);

	return { systemPrompt, organizationName: ORGANIZATION_FULL };
}

export function buildAgentSystemPrompt(params: {
	agentName?: string | null;
	agentRole: AiAgentRole;
	locale?: string | null;
}) {
	return buildNonHumanSystemPrompt(params);
}
