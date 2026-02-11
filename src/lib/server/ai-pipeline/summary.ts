import type { SupabaseClient } from '@supabase/supabase-js';

type SummaryRow = {
	summary: string;
	last_message_id: number | null;
};

export async function getOrUpdateRollingSummary(params: {
	supabaseAdmin: SupabaseClient;
	gameId: number;
	round: number;
	// Oldest message id in the recent-window; summary should cover ids < boundaryMessageId.
	boundaryMessageId: number;
	userId?: string | null;
}): Promise<{ summary: string | null; summaryUsed: boolean }> {
	const { supabaseAdmin, gameId, round, boundaryMessageId } = params;

	// Find newest message id that is older than the boundary; if none exist, no summary needed.
	const { data: oldestMaxRow, error: olderMaxErr } = await supabaseAdmin
		.from('discussion_messages')
		.select('id')
		.eq('game_id', gameId)
		.eq('round', round)
		.lt('id', boundaryMessageId)
		.order('id', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (olderMaxErr || !oldestMaxRow?.id) {
		return { summary: null, summaryUsed: false };
	}

	// Load existing summary row.
	let existing: SummaryRow | null = null;
	try {
		const { data } = await supabaseAdmin
			.from('discussion_round_summaries')
			.select('summary, last_message_id')
			.eq('game_id', gameId)
			.eq('round', round)
			.maybeSingle();
		existing = (data as SummaryRow | null) ?? null;
	} catch {
		existing = null;
	}

	let summaryText = (existing?.summary ?? '').trim();
	let lastMessageId = existing?.last_message_id ?? null;

	if (summaryText && lastMessageId !== null) {
		return { summary: summaryText, summaryUsed: true };
	}

	// Summary generation through IA is intentionally disabled in Round 7 flow.
	// We only reuse an already persisted summary when available.
	return { summary: null, summaryUsed: false };
}
