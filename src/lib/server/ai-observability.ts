import { getSupabaseAdmin } from '$lib/server/supabase-admin';

export type AiAuditPayload = {
	requestId: string;
	endpoint: string;
	gameId?: number | null;
	proposalId?: number | null;
	round?: number | null;
	provider?: string | null;
	model?: string | null;
	success: boolean;
	errorCode?: string | null;
	latencyMs?: number | null;
	promptSizes?: Record<string, number> | null;
	ragChunks?: number | null;
	summaryUsed?: boolean | null;
	validationFailures?: Record<string, unknown> | null;
};

export function createRequestId(): string {
	try {
		return crypto.randomUUID();
	} catch {
		return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
}

export function logAiEvent(label: string, data: Record<string, unknown>) {
	console.log(`[ai] ${label}`, data);
}

export async function persistAiAudit(payload: AiAuditPayload) {
	// Best-effort: auditing is optional and should never break the UX.
	try {
		const supabaseAdmin = getSupabaseAdmin();
		await supabaseAdmin.from('ai_request_audit').insert({
			request_id: payload.requestId,
			endpoint: payload.endpoint,
			game_id: payload.gameId ?? null,
			proposal_id: payload.proposalId ?? null,
			round: payload.round ?? null,
			provider: payload.provider ?? null,
			model: payload.model ?? null,
			success: payload.success,
			error_code: payload.errorCode ?? null,
			latency_ms: payload.latencyMs ?? null,
			prompt_sizes: payload.promptSizes ?? null,
			rag_chunks: payload.ragChunks ?? null,
			summary_used: payload.summaryUsed ?? null,
			validation_failures: payload.validationFailures ?? null
		});
	} catch {
		// Ignore audit failures.
	}
}

