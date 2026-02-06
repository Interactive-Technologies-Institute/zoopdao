import { createHash } from 'node:crypto';
import {
	IAEDU_API_KEY,
	IAEDU_CHANNEL_ID,
	IAEDU_ENDPOINT,
	IAEDU_THREAD_ID
} from '$env/static/private';
import type {
	AiAgentRole,
	AiGenerateRequest,
	AiGenerateResult,
	AiGenerateSuccess
} from '../llm-types';

const DEFAULT_ENDPOINT =
	'https://api.iaedu.pt/agent-chat//api/v1/agent/cmamvd3n40000c801qeacoad2/stream';
const USER_INFO_PREFIX = 'zoopdao';

function buildPrompt(request: AiGenerateRequest): string {
	const orgName = request.organizationName?.trim();
	const orgLine = orgName ? `Organization: ${orgName}` : null;
	const summary = request.discussionSummary?.trim();
	const summaryBlock = summary ? `Discussion summary:\n${summary}` : null;
	const chatHistory = Array.isArray(request.chatHistory) ? request.chatHistory : [];
	const chatHistoryBlock =
		chatHistory.length > 0
			? `Recent discussion messages:\n${chatHistory
					.map((msg) => `${msg.senderName} (${msg.senderType}, Round ${msg.round}): ${msg.content}`)
					.join('\n')}`
			: null;
	const promptParts = [
		request.systemPrompt?.trim() || null,
		orgLine,
		request.agentName?.trim() ? `Agent: ${request.agentName.trim()}` : null,
		`Round: ${request.round}`,
		request.proposalPoint ? `Proposal point:\n${request.proposalPoint}` : null,
		summaryBlock,
		chatHistoryBlock,
		request.ragContext ? `RAG context:\n${request.ragContext}` : null,
		request.latestUserMessage ? `Latest user message:\n${request.latestUserMessage}` : null
	].filter(Boolean);

	return promptParts.join('\n\n');
}

function resolveInputSource(request: AiGenerateRequest): 'manual' | 'auto' {
	if (request.inputSource) return request.inputSource;
	return request.latestUserMessage ? 'manual' : 'auto';
}

function buildUserInfo(request: AiGenerateRequest): string {
	const source = resolveInputSource(request);
	const rawUserId = request.userId?.trim() || 'anonymous';
	const encryptedId = createHash('sha256').update(rawUserId).digest('hex');
	const userId = `${USER_INFO_PREFIX}${encryptedId}`;

	return JSON.stringify({
		user_id: userId,
		input_source: source
	});
}

function parseIaeduResponse(text: string): { content: string | null; error?: unknown } {
	const events: Array<Record<string, unknown>> = [];
	let tokenBuffer = '';

	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const event = JSON.parse(trimmed);
			events.push(event);
			if (event?.type === 'token' && typeof event?.content === 'string') {
				tokenBuffer += event.content;
			}
		} catch {
			// Ignore non-JSON lines, but allow raw text fallback below.
		}
	}

	let finalMessage: string | null = null;
	let errorPayload: unknown;

	for (const event of events) {
		if (event.type === 'message' && typeof event.content === 'string') {
			finalMessage = event.content;
		}
		if (event.type === 'error') {
			errorPayload = event;
		}
	}

	if (!finalMessage && tokenBuffer.trim()) {
		finalMessage = tokenBuffer.trim();
	}

	if (!events.length && text.trim()) {
		finalMessage = text.trim();
	}

	if (errorPayload) {
		return { content: null, error: errorPayload };
	}

	return { content: finalMessage };
}

export async function generateAIMessageIaedu(
	request: AiGenerateRequest,
	options?: { signal?: AbortSignal }
): Promise<AiGenerateResult> {
	const startedAt = Date.now();
	const apiKey = IAEDU_API_KEY;
	if (!apiKey) {
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
	const threadId = IAEDU_THREAD_ID || '';

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

	if (!threadId) {
		return {
			success: false,
			error: {
				code: 'invalid_request',
				message: 'IAEDU thread id is not configured.',
				provider: 'iaedu'
			}
		};
	}

	const formData = new FormData();
	const prompt = buildPrompt(request);
	const userInfo = buildUserInfo(request);
	formData.append('channel_id', channelId);
	formData.append('thread_id', threadId);
	formData.append('user_info', userInfo);
	formData.append('message', prompt);

	console.log('[iaedu] request', {
		agentRole: request.agentRole,
		round: request.round,
		inputSource: resolveInputSource(request),
		promptLength: prompt.length,
		hasRagContext: Boolean(request.ragContext),
		endpoint
	});

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'x-api-key': apiKey
			},
			// Let fetch set multipart boundaries when using FormData.
			body: formData,
			signal: options?.signal
		});

		if (!response.ok) {
			const details = await response.text();
			console.log('[iaedu] response error', {
				status: response.status,
				elapsedMs: Date.now() - startedAt
			});
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

		const rawText = await response.text();
		console.log('[iaedu] response ok', {
			status: response.status,
			elapsedMs: Date.now() - startedAt,
			rawLength: rawText.length
		});
		const { content, error } = parseIaeduResponse(rawText);

		if (error) {
			console.log('[iaedu] response parse error', {
				elapsedMs: Date.now() - startedAt
			});
			return {
				success: false,
				error: {
					code: 'provider_error',
					message: 'IAEDU returned an error response.',
					details: JSON.stringify(error),
					provider: 'iaedu'
				}
			};
		}

		if (!content) {
			console.log('[iaedu] empty content', {
				elapsedMs: Date.now() - startedAt
			});
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

		console.log('[iaedu] success', {
			elapsedMs: Date.now() - startedAt,
			contentLength: content.length
		});
		return success;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.log('[iaedu] request aborted', {
				elapsedMs: Date.now() - startedAt
			});
			return {
				success: false,
				error: {
					code: 'timeout',
					message: 'IAEDU request timed out.',
					provider: 'iaedu'
				}
			};
		}
		console.log('[iaedu] request failed', {
			elapsedMs: Date.now() - startedAt,
			error: error instanceof Error ? error.message : String(error)
		});
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
