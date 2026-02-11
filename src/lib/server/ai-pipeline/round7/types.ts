import type { AiAgentRole } from '$lib/ai/llm-types';

export type Round7PipelineRoutingMode = 'aquari_only' | 'rule' | 'planner';
export type Round7PipelineFailMode = 'hard_error';
export type Round7PipelineLogLevel = 'off' | 'step' | 'full';

export type BatchAgent = {
	id: string;
	name: string;
	role: AiAgentRole;
};

export type Round7BatchRequest = {
	gameId: number;
	proposalId: number | null;
	round: 7;
	userId: string;
	locale?: string | null;
	latestUserMessage?: string | null;
	agents: BatchAgent[];
	activeAgentIds?: string[];
	userTurnHint?: number;
	clientRequestId?: string;
};

export type SceneErrorMode = 'none' | 'hard_error';
export type RoutingSource = 'rule' | 'llm_planner' | 'fallback';

export type ScenePlan = {
	userTurn: number;
	activeAgentIds: string[];
	speakingOrder: string[];
	revealAgentIds: string[];
	errorMode: SceneErrorMode;
	routing: {
		selectedAgentId: string;
		confidence: number;
		matchedTerms: string[];
		scoreByAgent: Record<string, number>;
		reason: string;
		routingSource: RoutingSource;
		plannerUsed: boolean;
		plannerReason?: string;
	};
};

export type ContextMessage = {
	senderType: 'human' | 'ai';
	senderName: string;
	round: number;
	content: string;
};

export type Round7ContextData = {
	organizationName: string | null;
	currentUserProfile: {
		name: string | null;
		role: string | null;
		description: string | null;
	};
	proposalTitle: string | null;
	proposalContext: string | null;
	assemblyParticipants: string | null;
	discussionSummary: string | null;
	chatHistory: ContextMessage[];
	ragContext: string | null;
	ragChunkCount: number;
	summaryUsed: boolean;
	promptSizes: {
		proposalContextChars: number;
		summaryChars: number;
		historyChars: number;
		ragChars: number;
		assemblyParticipantsChars?: number;
	};
};

export type ProviderFailure = {
	agentId: string;
	code: string;
	message: string;
	details?: string | null;
};

export type OutputMessage = {
	agentId: string;
	agentName: string;
	agentRole: AiAgentRole;
	round: number;
	content: string;
	dbId: number;
	createdAt: string;
};

export type Round7PipelineHttpResult = {
	status: number;
	body: Record<string, unknown>;
};

export type Round7PipelineConfig = {
	enabled: boolean;
	logLevel: Round7PipelineLogLevel;
};
