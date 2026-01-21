import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiGenerateRequest } from '../../../../src/lib/ai/llm-types';

const baseRequest: AiGenerateRequest = {
	gameId: 1,
	proposalId: 2,
	round: 1,
	agentRole: 'research',
	proposalPoint: 'Test proposal point',
	chatHistory: [],
	latestUserMessage: 'Hello',
	userId: 'user-123',
	mode: 'pedagogic'
};

async function loadModule(env: { apiKey?: string; endpoint?: string } = {}) {
	vi.resetModules();
	vi.doMock('$env/static/private', () => ({
		IAEDU_API_KEY: env.apiKey ?? '',
		IAEDU_ENDPOINT: env.endpoint ?? 'https://example.com/stream',
		IAEDU_CHANNEL_ID: 'channel-test',
		IAEDU_THREAD_ID: 'thread-test'
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

		globalThis.fetch = vi.fn(async (_url, init) => {
			const formData = init?.body as FormData;
			capturedUserInfo = formData?.get('user_info') as string;
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
});
