import type { BatchAgent, ScenePlan } from './types';

const TOP_MID_AGENT_ID = 'ai-agent-aquari';

export function resolveTopMidAgent(agents: BatchAgent[]): BatchAgent {
	return (
		agents.find((agent) => agent.id === TOP_MID_AGENT_ID) ??
		agents.find((agent) => agent.role === 'reception') ??
		agents[0]
	);
}

export function buildAquariOnlyScenePlan(params: {
	userTurn: number;
	agents: BatchAgent[];
	activeAgentIds: string[];
}): ScenePlan {
	const topMid = resolveTopMidAgent(params.agents);
	const topMidId = topMid.id;
	const active = Array.from(new Set([topMidId, ...params.activeAgentIds])).filter((id) => id === topMidId);
	return {
		userTurn: params.userTurn,
		activeAgentIds: active.length ? active : [topMidId],
		speakingOrder: [topMidId],
		revealAgentIds: [],
		errorMode: 'none',
		routing: {
			selectedAgentId: topMidId,
			confidence: 1,
			matchedTerms: [],
			scoreByAgent: Object.fromEntries(params.agents.map((agent) => [agent.id, agent.id === topMidId ? 1 : 0])),
			reason: params.userTurn === 1 ? 'turn_1_forced' : 'aquari_only_v2',
			routingSource: 'rule',
			plannerUsed: false
		}
	};
}
