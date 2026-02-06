export const AI_AGENT_ROLES = [
	'administration',
	'research',
	'reception',
	'operations',
	'bar',
	'cleaning'
] as const;

export type AiAgentRole = (typeof AI_AGENT_ROLES)[number];
export type AiProvider = 'gemini' | 'iaedu';

export interface AiChatMessage {
	content: string;
	senderType: 'human' | 'ai';
	senderName: string;
	round: number;
}

export interface AiGenerateRequest {
	gameId: number;
	proposalId: number | null;
	round: number;
	agentRole: AiAgentRole;
	agentName?: string | null;
	userId?: string | null;
	inputSource?: 'manual' | 'auto';
	proposalPoint?: string;
	discussionSummary?: string | null;
	chatHistory?: AiChatMessage[];
	latestUserMessage?: string | null;
	ragContext?: string;
	mode?: 'pedagogic' | 'decision_making' | 'unknown';
	systemPrompt?: string | null;
	organizationName?: string | null;
}

export interface AiGeneratedMessage {
	id?: number | string;
	content: string;
	agentRole: AiAgentRole;
	round: number;
	createdAt?: string;
}

export interface AiGenerateSuccess {
	success: true;
	provider: AiProvider;
	model: string;
	message: AiGeneratedMessage;
}

export type AiErrorCode =
	| 'invalid_request'
	| 'rate_limited'
	| 'provider_unavailable'
	| 'provider_error'
	| 'timeout'
	| 'unauthorized'
	| 'unknown';

export interface AiGenerateError {
	success: false;
	error: {
		code: AiErrorCode;
		message: string;
		details?: string;
		retryAfterSeconds?: number;
		provider?: AiProvider;
	};
}

export type AiGenerateResult = AiGenerateSuccess | AiGenerateError;

export const AI_MESSAGE_MIN_CHARS = 1;
export const AI_MESSAGE_MAX_CHARS = 500;
export const AI_DEFAULT_TIMEOUT_MS = 20_000;
export const AI_IAEDU_TIMEOUT_MS = 45_000;
export const AI_MAX_RETRIES = 3;
