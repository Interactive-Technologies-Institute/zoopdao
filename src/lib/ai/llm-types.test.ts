import { describe, expect, it } from 'vitest';
import {
	AI_AGENT_ROLES,
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
});
