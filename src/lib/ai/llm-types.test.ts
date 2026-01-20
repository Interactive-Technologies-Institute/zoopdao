import { describe, expect, it } from 'vitest';
import {
	AI_AGENT_ROLES,
	AI_DEFAULT_TIMEOUT_MS,
	AI_MAX_RETRIES,
	AI_MESSAGE_MAX_CHARS,
	AI_MESSAGE_MIN_CHARS
} from './llm-types';

describe('llm-types', () => {
	it('defines the expected agent roles', () => {
		expect(AI_AGENT_ROLES).toEqual([
			'administration',
			'research',
			'reception',
			'operations',
			'bar',
			'cleaning'
		]);
	});

	it('defines valid message length constraints', () => {
		expect(AI_MESSAGE_MIN_CHARS).toBeGreaterThan(0);
		expect(AI_MESSAGE_MAX_CHARS).toBeGreaterThanOrEqual(AI_MESSAGE_MIN_CHARS);
	});

	it('defines retry and timeout defaults', () => {
		expect(AI_DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
		expect(AI_MAX_RETRIES).toBeGreaterThanOrEqual(0);
	});
});
