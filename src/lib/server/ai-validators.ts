const DEFAULT_MAX_CHARS = 200;

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function stripWrappingQuotes(text: string): string {
	const trimmed = text.trim();
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

function firstLine(text: string): string {
	return text.split('\n')[0] ?? '';
}

export type ValidationResult = { ok: true; value: string } | { ok: false; reason: string };

export function validateOneSentenceQuestion(raw: string, maxChars: number = DEFAULT_MAX_CHARS): ValidationResult {
	const cleaned = normalizeWhitespace(stripWrappingQuotes(firstLine(raw)));
	if (!cleaned) return { ok: false, reason: 'empty' };
	if (cleaned.length > maxChars) return { ok: false, reason: 'too_long' };

	if (!cleaned.endsWith('?')) return { ok: false, reason: 'missing_question_mark' };
	if ((cleaned.match(/\?/g) ?? []).length !== 1) return { ok: false, reason: 'multiple_question_marks' };

	// Enforce "one sentence" conservatively: no other sentence terminators besides final '?'.
	const withoutTrailing = cleaned.slice(0, -1);
	if (/[.!?]/.test(withoutTrailing)) return { ok: false, reason: 'multiple_sentence_terminators' };

	return { ok: true, value: cleaned };
}

export function validateOneSentenceStatement(
	raw: string,
	maxChars: number = DEFAULT_MAX_CHARS
): ValidationResult {
	const cleaned = normalizeWhitespace(stripWrappingQuotes(firstLine(raw)));
	if (!cleaned) return { ok: false, reason: 'empty' };

	// If the model returns multiple sentences, keep only the first terminal sentence.
	const match = cleaned.match(/^(.+?[.!?])(\s|$)/);
	const firstSentence = match ? match[1].trim() : cleaned;
	const clamped = firstSentence.length > maxChars ? firstSentence.slice(0, maxChars).trimEnd() : firstSentence;

	// Reject if we still see multiple terminators in the kept sentence (very likely multi-sentence).
	const terminators = clamped.match(/[.!?]/g) ?? [];
	if (terminators.length > 1) return { ok: false, reason: 'multiple_sentence_terminators' };

	if (!clamped) return { ok: false, reason: 'empty' };
	return { ok: true, value: clamped };
}
