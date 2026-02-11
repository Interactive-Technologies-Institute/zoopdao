import { generateAIMessageIaedu } from '$lib/ai/providers/iaedu';
import type { AiGenerateError } from '$lib/ai/llm-types';
import type { BatchAgent, Round7ContextData } from './types';
import { buildMinimalTextPrompt } from './prompt';

function stripSpeakerPrefix(content: string, agentName: string): string {
	const trimmed = content.trim();
	if (!trimmed || !agentName.trim()) return trimmed;
	const pattern = new RegExp(`^${agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*`, 'i');
	return trimmed.replace(pattern, '').trim();
}

export async function sendOne(params: {
	gameId: number;
	proposalId: number | null;
	userId: string;
	providerThreadId: string;
	round: number;
	locale: string | null | undefined;
	latestUserMessage: string;
	agent: BatchAgent;
	context: Round7ContextData;
}): Promise<{ ok: true; content: string } | { ok: false; error: AiGenerateError['error'] }> {
	const {
		gameId,
		proposalId,
		userId,
		providerThreadId,
		round,
		locale,
		latestUserMessage,
		agent,
		context
	} = params;

	const baseRequest = {
		gameId,
		proposalId,
		round,
		agentRole: agent.role,
		agentName: agent.name,
		userId,
		providerThreadId,
		inputSource: latestUserMessage ? ('manual' as const) : ('auto' as const),
		organizationName: context.organizationName ?? null,
		currentUserProfile: {
			name: context.currentUserProfile.name,
			role: context.currentUserProfile.role,
			description: context.currentUserProfile.description
		},
		proposalPoint: context.proposalContext ?? undefined,
		discussionSummary: context.discussionSummary ?? undefined,
		assemblyParticipants: context.assemblyParticipants ?? undefined,
		chatHistory: context.chatHistory,
		ragContext: context.ragContext ?? undefined,
		latestUserMessage
	};

	const result = await generateAIMessageIaedu({
		...baseRequest,
		systemPrompt: buildMinimalTextPrompt({
			agent,
			locale
		}),
		promptPayload: undefined
	});

	if (!result.success) {
		return { ok: false, error: result.error };
	}

	const cleaned = stripSpeakerPrefix(result.message.content, agent.name).replace(/\s+/g, ' ').trim();
	if (!cleaned) {
		return {
			ok: false,
			error: {
				code: 'invalid_request',
				message: 'Provider returned empty text.',
				provider: 'iaedu'
			}
		};
	}

	return { ok: true, content: cleaned };
}
