const DEFAULT_MAX_CHARS = 200;
const UUID_LIKE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_HEX_RE = /^[0-9a-f]{24,}$/i;
const COMPACT_ALNUM_ID_RE = /^[a-z0-9_-]{20,}$/i;

function stripInvisible(text: string): string {
	// Some providers include zero-width chars; strip them for stable validation.
	return text.replace(/[\u00AD\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g, '');
}

function stripEdgePunctuation(text: string): string {
	return text.replace(/^[\s"'`([{<:]+|[\s"'`\])}>:,.!?;]+$/g, '').trim();
}

function isIdentifierLikeValue(text: string): boolean {
	const cleaned = stripEdgePunctuation(stripInvisible(text));
	if (UUID_LIKE_RE.test(cleaned) || LONG_HEX_RE.test(cleaned)) return true;
	if (!COMPACT_ALNUM_ID_RE.test(cleaned)) return false;
	if (cleaned.includes(' ')) return false;
	const hasLetters = /[a-z]/i.test(cleaned);
	const hasDigits = /\d/.test(cleaned);
	return hasLetters && hasDigits;
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function stripWrappingQuotes(text: string): string {
	const trimmed = text.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

function firstLine(text: string): string {
	return text.split('\n')[0] ?? '';
}

export type ValidationResult = { ok: true; value: string } | { ok: false; reason: string };

export function validateOneSentenceQuestion(
	raw: string,
	maxChars: number = DEFAULT_MAX_CHARS
): ValidationResult {
	const cleaned = normalizeWhitespace(stripWrappingQuotes(firstLine(raw)));
	if (!cleaned) return { ok: false, reason: 'empty' };
	if (cleaned.length > maxChars) return { ok: false, reason: 'too_long' };

	if (!cleaned.endsWith('?')) return { ok: false, reason: 'missing_question_mark' };
	if ((cleaned.match(/\?/g) ?? []).length !== 1)
		return { ok: false, reason: 'multiple_question_marks' };

	// Enforce "one sentence" conservatively: no other sentence terminators besides final '?'.
	const withoutTrailing = cleaned.slice(0, -1);
	if (/[.!?]/.test(withoutTrailing)) return { ok: false, reason: 'multiple_sentence_terminators' };

	return { ok: true, value: cleaned };
}

export function validateOneSentenceStatement(
	raw: string,
	maxChars: number = DEFAULT_MAX_CHARS
): ValidationResult {
	const cleaned = stripInvisible(normalizeWhitespace(stripWrappingQuotes(firstLine(raw))));
	if (!cleaned) return { ok: false, reason: 'empty' };

	const placeholder = cleaned.toLowerCase();
	// Guardrail: some providers stream interim status messages like "Processing".
	// Reject these so we retry/repair or fall back.
	if (
		placeholder === 'processing' ||
		placeholder === 'thinking' ||
		placeholder === 'loading' ||
		placeholder === 'working' ||
		placeholder === 'please wait' ||
		placeholder === 'unexpected processing error' ||
		placeholder === 'erro inesperado de processamento'
	) {
		return { ok: false, reason: 'placeholder_response' };
	}
	if (isIdentifierLikeValue(cleaned)) {
		return { ok: false, reason: 'identifier_like_response' };
	}

	// If the model returns multiple sentences, keep only the first terminal sentence.
	const match = cleaned.match(/^(.+?[.!?])(\s|$)/);
	const firstSentence = match ? match[1].trim() : cleaned;
	const clamped =
		firstSentence.length > maxChars ? firstSentence.slice(0, maxChars).trimEnd() : firstSentence;

	// Reject if we still see multiple terminators in the kept sentence (very likely multi-sentence).
	const terminators = clamped.match(/[.!?]/g) ?? [];
	if (terminators.length > 1) return { ok: false, reason: 'multiple_sentence_terminators' };

	if (!clamped) return { ok: false, reason: 'empty' };
	return { ok: true, value: clamped };
}
