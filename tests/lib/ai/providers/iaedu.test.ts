import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiGenerateRequest } from '../../../../src/lib/ai/llm-types';

const baseRequest: AiGenerateRequest = {
	gameId: 1,
	proposalId: 2,
	round: 1,
	agentRole: 'research',
	proposalPoint: 'Test proposal point',
	ragContext: 'RAG context chunk',
	chatHistory: [],
	latestUserMessage: 'Hello',
	userId: 'user-123',
	mode: 'pedagogic',
	currentUserProfile: {
		name: 'Admin',
		role: 'Research',
		description: 'Marine ecology lead'
	},
	assemblyParticipants:
		'BEGIN UNTRUSTED ASSEMBLY_PARTICIPANTS\n- Admin | Role: Research | Description: Marine ecology lead\nEND UNTRUSTED ASSEMBLY_PARTICIPANTS'
};

async function loadModule(env: { apiKey?: string; endpoint?: string } = {}) {
	vi.resetModules();
	vi.doMock('$env/static/private', () => ({
		IAEDU_API_KEY: env.apiKey ?? '',
		IAEDU_ENDPOINT: env.endpoint ?? 'https://example.com/stream',
		IAEDU_CHANNEL_ID: 'channel-test',
		IAEDU_THREAD_ID: 'thread-test',
		IAEDU_DEBUG_LOG_RAW: ''
	}));

	return import('../../../../src/lib/ai/providers/iaedu');
}

const originalFetch = globalThis.fetch;

afterEach(() => {
	vi.restoreAllMocks();
	if (originalFetch) {
		globalThis.fetch = originalFetch;
	} else {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
	}
});

describe('generateAIMessageIaedu', () => {
	it('returns unauthorized when API key is missing', async () => {
		const { generateAIMessageIaedu } = await loadModule();
		const result = await generateAIMessageIaedu(baseRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('unauthorized');
			expect(result.error.provider).toBe('iaedu');
		}
	});

	it('returns success with parsed message and user_info', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });
		let capturedUserInfo: string | null = null;
		let capturedMessage: string | null = null;

		globalThis.fetch = vi.fn(async (_url, init) => {
			const formData = init?.body as FormData;
			capturedUserInfo = formData?.get('user_info') as string;
			capturedMessage = formData?.get('message') as string;
			return {
				ok: true,
				text: async () => JSON.stringify({ type: 'message', content: 'Hello from IAEDU.' })
			};
		}) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.provider).toBe('iaedu');
			expect(result.message.content).toBe('Hello from IAEDU.');
			expect(result.message.agentRole).toBe('research');
		}

		expect(capturedUserInfo).toBeTruthy();
		const parsed = JSON.parse(capturedUserInfo || '{}');
		const expectedHash = createHash('sha256').update('user-123').digest('hex');
		expect(parsed.user_id).toBe(`zoopdao${expectedHash}`);
		expect(parsed.input_source).toBe('manual');
		expect(capturedMessage).toContain('RAG context:');
		expect(capturedMessage).toContain('Current user profile:');
		expect(capturedMessage).toContain('- Name: Admin');
		expect(capturedMessage).toContain('Assembly participants:');
	});

	it('uses token stream output when no final message is present', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const tokenStream = [
			JSON.stringify({ type: 'token', content: 'Hi' }),
			JSON.stringify({ type: 'token', content: ' there' })
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => tokenStream
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Hi there');
		}
	});

	it('prefers token content over identifier-like final message events', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const stream = [
			JSON.stringify({
				type: 'message',
				content: '991743cc-5a21-449a-816e-1b69813f384d'
			}),
			JSON.stringify({ type: 'token', content: 'Resposta ecológica válida.' })
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => stream
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Resposta ecológica válida.');
		}
	});

	it('ignores compact id-like message events and keeps token content', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const stream = [
			JSON.stringify({
				type: 'message',
				content: 'cmlfp0dcg055lhd01y8nxu4ps'
			}),
			JSON.stringify({ type: 'token', content: 'Resposta válida em português.' })
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => stream
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Resposta válida em português.');
		}
	});

	it('treats non-fatal error events as warnings when a message is present', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const stream = [
			JSON.stringify({ type: 'token', content: 'Ola' }),
			JSON.stringify({ type: 'error', message: 'diagnostic' }),
			JSON.stringify({ type: 'token', content: ' mundo' })
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => stream
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Ola mundo');
		}
	});

	it('parses SSE-style data lines', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const sse = [
			'event: token',
			`data: ${JSON.stringify({ type: 'token', content: 'Hi' })}`,
			`data: ${JSON.stringify({ type: 'token', content: '!' })}`,
			'data: [DONE]'
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => sse
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Hi!');
		}
	});

	it('accepts token events that use "token" field instead of "content"', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		const stream = [
			JSON.stringify({ type: 'token', token: 'Hi' }),
			JSON.stringify({ type: 'token', token: ' there' })
		].join('\n');

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			text: async () => stream
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('Hi there');
		}
	});

	it('maps rate limits to a standardized error', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });

		globalThis.fetch = vi.fn(async () => ({
			ok: false,
			status: 429,
			text: async () => 'rate limit'
		})) as typeof fetch;

		const result = await generateAIMessageIaedu(baseRequest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('rate_limited');
			expect(result.error.provider).toBe('iaedu');
		}
	});

	it('sends promptPayload as JSON message when provided', async () => {
		const { generateAIMessageIaedu } = await loadModule({ apiKey: 'test-key' });
		let capturedMessage: string | null = null;

		globalThis.fetch = vi.fn(async (_url, init) => {
			const formData = init?.body as FormData;
			capturedMessage = formData?.get('message') as string;
			return {
				ok: true,
				text: async () => JSON.stringify({ type: 'message', content: 'Planner ok.' })
			};
		}) as typeof fetch;

		const payload = {
			schema: 'round7.orchestrator.v1',
			meta: { round: 7 },
			output: { instruction: 'Return JSON only.' }
		};

		const result = await generateAIMessageIaedu({
			...baseRequest,
			promptPayload: payload
		});

		expect(result.success).toBe(true);
		expect(capturedMessage).toBe(JSON.stringify(payload));
		if (result.success) {
			expect(result.message.content).toBe('Planner ok.');
		}
	});
});
