import { describe, expect, it } from 'vitest';
import { validateOneSentenceQuestion, validateOneSentenceStatement } from '../../../src/lib/server/ai-validators';

describe('validateOneSentenceQuestion', () => {
	it('accepts a single question sentence ending with ?', () => {
		const result = validateOneSentenceQuestion('What do you think?');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe('What do you think?');
		}
	});

	it('rejects multiple question marks', () => {
		const result = validateOneSentenceQuestion('What do you think??');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe('multiple_question_marks');
		}
	});

	it('rejects other sentence terminators before the final ?', () => {
		const result = validateOneSentenceQuestion('Tell me. What do you think?');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe('multiple_sentence_terminators');
		}
	});

	it('strips wrapping quotes and uses the first line', () => {
		const result = validateOneSentenceQuestion('"What do you think?"\n\nExtra');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe('What do you think?');
		}
	});
});

describe('validateOneSentenceStatement', () => {
	it('keeps only the first terminal sentence when multiple sentences are returned', () => {
		const result = validateOneSentenceStatement('I agree. Second sentence.');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe('I agree.');
		}
	});

	it('rejects when multiple terminators remain in the kept sentence', () => {
		const result = validateOneSentenceStatement('Hello!?');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe('multiple_sentence_terminators');
		}
	});
});

