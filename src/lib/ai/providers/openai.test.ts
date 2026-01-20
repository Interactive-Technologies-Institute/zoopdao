import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiGenerateRequest } from '../llm-types';

const baseRequest: AiGenerateRequest = {
	gameId: 1,
	proposalId: 2,
	round: 1,
	agentRole: 'research',
	proposalPoint: 'Test proposal point',
	chatHistory: [],
	latestUserMessage: 'Hello',
	mode: 'pedagogic'
};

async function loadModule(env: { apiKey?: string; model?: string } = {}) {
	vi.resetModules();
	vi.doMock('$env/static/private', () => ({
		OPENAI_API_KEY: env.apiKey ?? '',
		OPENAI_MODEL: env.model ?? ''
	}));

	return import('./openai');
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

describe('generateOpenAiDiscussionMessage', () => {
	it('returns unauthorized when API key is missing', async () => {
		const { generateOpenAiDiscussionMessage } = await loadModule();
		const result = await generateOpenAiDiscussionMessage(baseRequest);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('unauthorized');
			expect(result.error.provider).toBe('openai');
		}
	});

	it('returns success with parsed content', async () => {
		const { generateOpenAiDiscussionMessage } = await loadModule({
			apiKey: 'test-key',
			model: 'gpt-4o-test'
		});

		const payload = {
			choices: [{ message: { content: JSON.stringify({ content: 'Hello from OpenAI.' }) } }]
		};

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			json: async () => payload
		})) as typeof fetch;

		const result = await generateOpenAiDiscussionMessage(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.provider).toBe('openai');
			expect(result.model).toBe('gpt-4o-test');
			expect(result.message.content).toBe('Hello from OpenAI.');
			expect(result.message.agentRole).toBe('research');
		}
	});

	it('joins multiple messages into one response', async () => {
		const { generateOpenAiDiscussionMessage } = await loadModule({ apiKey: 'test-key' });
		const payload = {
			choices: [
				{
					message: {
						content: JSON.stringify([
							{ content: 'First sentence.' },
							{ content: 'Second sentence.' }
						])
					}
				}
			]
		};

		globalThis.fetch = vi.fn(async () => ({
			ok: true,
			json: async () => payload
		})) as typeof fetch;

		const result = await generateOpenAiDiscussionMessage(baseRequest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.message.content).toBe('First sentence.\n\nSecond sentence.');
		}
	});

	it('maps rate limits to a standardized error', async () => {
		const { generateOpenAiDiscussionMessage } = await loadModule({ apiKey: 'test-key' });

		globalThis.fetch = vi.fn(async () => ({
			ok: false,
			status: 429,
			text: async () => 'rate limit'
		})) as typeof fetch;

		const result = await generateOpenAiDiscussionMessage(baseRequest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe('rate_limited');
			expect(result.error.provider).toBe('openai');
		}
	});
});
