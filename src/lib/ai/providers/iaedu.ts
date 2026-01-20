import {
	IAEDU_API_KEY,
	IAEDU_CHANNEL_ID,
	IAEDU_ENDPOINT,
	IAEDU_THREAD_ID,
	IAEDU_USER_INFO
} from '$env/static/private';
import type {
	AiAgentRole,
	AiGenerateRequest,
	AiGenerateResult,
	AiGenerateSuccess
} from '../llm-types';

const DEFAULT_ENDPOINT =
	'https://api.iaedu.pt/agent-chat//api/v1/agent/cmamvd3n40000c801qeacoad2/stream';

const roleSystemPrompts: Record<AiAgentRole, string> = {
	administration: `You are an Administration role participant in the Aquário Vasco da Gama governance assembly.`,
	research: `You are a Research role participant in the Aquário Vasco da Gama governance assembly.`,
	reception: `You are a Reception role participant in the Aquário Vasco da Gama governance assembly.`,
	operations: `You are an Operations role participant in the Aquário Vasco da Gama governance assembly.`,
	bar: `You are a Bar role participant in the Aquário Vasco da Gama governance assembly.`,
	cleaning: `You are a Cleaning role participant in the Aquário Vasco da Gama governance assembly.`
};

function buildPrompt(request: AiGenerateRequest): string {
	const promptParts = [
		roleSystemPrompts[request.agentRole] ?? roleSystemPrompts.administration,
		`Round: ${request.round}`,
		request.proposalPoint ? `Proposal point:\n${request.proposalPoint}` : null,
		request.latestUserMessage ? `Latest user message:\n${request.latestUserMessage}` : null
	].filter(Boolean);

	return promptParts.join('\n\n');
}

function parseUserInfo(): string {
	if (!IAEDU_USER_INFO) return '{}';
	try {
		JSON.parse(IAEDU_USER_INFO);
		return IAEDU_USER_INFO;
	} catch {
		return '{}';
	}
}

function buildThreadId(request: AiGenerateRequest): string {
	if (IAEDU_THREAD_ID && IAEDU_THREAD_ID.trim().length > 0) {
		return IAEDU_THREAD_ID;
	}

	const gamePart = request.gameId > 0 ? request.gameId : Date.now();
	return `${gamePart}-${request.agentRole}`;
}

export async function generateIaeduDiscussionMessage(
	request: AiGenerateRequest
): Promise<AiGenerateResult> {
	if (!IAEDU_API_KEY) {
		return {
			success: false,
			error: {
				code: 'unauthorized',
				message: 'IAEDU API key is not configured.',
				provider: 'iaedu'
			}
		};
	}

	const endpoint = IAEDU_ENDPOINT || DEFAULT_ENDPOINT;
	const channelId = IAEDU_CHANNEL_ID || '';
	const threadId = buildThreadId(request);

	if (!channelId) {
		return {
			success: false,
			error: {
				code: 'invalid_request',
				message: 'IAEDU channel id is not configured.',
				provider: 'iaedu'
			}
		};
	}

	const formData = new FormData();
	formData.append('channel_id', channelId);
	formData.append('thread_id', threadId);
	formData.append('user_info', parseUserInfo());
	formData.append('message', buildPrompt(request));

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'x-api-key': IAEDU_API_KEY
			},
			body: formData
		});

		if (!response.ok) {
			const details = await response.text();
			return {
				success: false,
				error: {
					code: response.status === 429 ? 'rate_limited' : 'provider_error',
					message: 'IAEDU request failed.',
					details,
					provider: 'iaedu'
				}
			};
		}

		const content = (await response.text()).trim();

		if (!content) {
			return {
				success: false,
				error: {
					code: 'provider_error',
					message: 'IAEDU returned an empty response.',
					provider: 'iaedu'
				}
			};
		}

		const success: AiGenerateSuccess = {
			success: true,
			provider: 'iaedu',
			model: 'iaedu',
			message: {
				content,
				agentRole: request.agentRole,
				round: request.round,
				createdAt: new Date().toISOString()
			}
		};

		return success;
	} catch (error) {
		return {
			success: false,
			error: {
				code: 'provider_error',
				message: 'IAEDU request failed.',
				details: error instanceof Error ? error.message : String(error),
				provider: 'iaedu'
			}
		};
	}
}
