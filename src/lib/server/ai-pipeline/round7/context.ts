import type { AiAgentRole } from '$lib/ai/llm-types';
import { buildRound7Context } from '$lib/server/ai-pipeline/context';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';
import type { BatchAgent, Round7BatchRequest, Round7ContextData } from './types';

const TOP_MID_AGENT_ID = 'ai-agent-aquari';
const MAX_ROUND7_USER_TURNS = 5;

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

function buildThreadId(): string {
	try {
		return `r7-${crypto.randomUUID()}`;
	} catch {
		return `r7-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
	}
}

export async function resolveActivePlayer(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	userId: string;
}): Promise<number | null> {
	const { supabaseAdmin, gameId, userId } = params;
	const { data, error } = await supabaseAdmin
		.from('players')
		.select('id, is_active')
		.eq('game_id', gameId)
		.eq('user_id', userId)
		.maybeSingle();
	if (error || !data || (data as any).is_active === false) return null;
	const id = Number((data as any).id);
	return Number.isFinite(id) ? id : null;
}

export async function validateGameProposal(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	proposalId: number;
}): Promise<boolean> {
	const { supabaseAdmin, gameId, proposalId } = params;
	const { data, error } = await supabaseAdmin
		.from('games')
		.select('proposal_id')
		.eq('id', gameId)
		.maybeSingle();
	if (error || !data) return false;
	return (data as any).proposal_id === proposalId;
}

export async function fetchExistingByClientRequestId(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	round: number;
	clientRequestId?: string;
}): Promise<any[]> {
	const { supabaseAdmin, gameId, round, clientRequestId } = params;
	const id = (clientRequestId ?? '').trim();
	if (!id) return [];
	const { data, error } = await supabaseAdmin
		.from('discussion_messages')
		.select('*')
		.eq('game_id', gameId)
		.eq('round', round)
		.eq('participant_type', 'ai_agent')
		.contains('metadata', { client_request_id: id });
	if (error || !data) return [];
	return data as any[];
}

export async function buildContext(params: {
	supabaseAdmin: SupabaseAdmin;
	payload: Round7BatchRequest;
	latestUserMessage: string;
}): Promise<Round7ContextData> {
	const { supabaseAdmin, payload, latestUserMessage } = params;
	const context = await buildRound7Context({
		supabaseAdmin,
		gameId: payload.gameId,
		proposalId: payload.proposalId,
		userId: payload.userId,
		latestUserMessage: latestUserMessage.length ? latestUserMessage : null
	});
	return {
		organizationName: context.organizationName ?? null,
		currentUserProfile: {
			name: context.currentUserProfile.nickname ?? null,
			role: context.currentUserProfile.role ?? null,
			description: context.currentUserProfile.description ?? null
		},
		proposalTitle: context.proposalTitle ?? null,
		proposalContext: context.proposalContext ?? null,
		assemblyParticipants: context.assemblyParticipants ?? null,
		discussionSummary: context.discussionSummary ?? null,
		chatHistory: context.chatHistory,
		ragContext: context.ragContext ?? null,
		ragChunkCount: context.ragChunkCount,
		summaryUsed: context.summaryUsed,
		promptSizes: context.promptSizes
	};
}

export async function resolveOrCreateProviderThreadId(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	round: number;
	userId: string;
	provider: 'iaedu';
}): Promise<string | null> {
	const { supabaseAdmin, gameId, round, userId, provider } = params;
	const providerName = provider.trim().toLowerCase();
	const normalizedUserId = userId.trim();
	if (!normalizedUserId) return null;

	const { data: existing, error: existingError } = await supabaseAdmin
		.from('ai_provider_threads')
		.select('thread_id')
		.eq('game_id', gameId)
		.eq('round', round)
		.eq('user_id', normalizedUserId)
		.eq('provider', providerName)
		.maybeSingle();

	if (!existingError && typeof (existing as any)?.thread_id === 'string' && (existing as any).thread_id.trim()) {
		return (existing as any).thread_id.trim();
	}

	const newThreadId = buildThreadId();
	const { error: upsertError } = await supabaseAdmin.from('ai_provider_threads').upsert(
		{
			game_id: gameId,
			round,
			user_id: normalizedUserId,
			provider: providerName,
			thread_id: newThreadId,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'game_id,round,user_id,provider' }
	);

	if (!upsertError) return newThreadId;

	const { data: fallback } = await supabaseAdmin
		.from('ai_provider_threads')
		.select('thread_id')
		.eq('game_id', gameId)
		.eq('round', round)
		.eq('user_id', normalizedUserId)
		.eq('provider', providerName)
		.maybeSingle();

	if (typeof (fallback as any)?.thread_id === 'string' && (fallback as any).thread_id.trim()) {
		return (fallback as any).thread_id.trim();
	}
	return null;
}

export async function resolveRound7State(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	playerId: number;
	userTurnHint?: number;
	hintedActiveAgentIds?: string[];
	agents: BatchAgent[];
}): Promise<{ userTurn: number; activeAgentIds: string[] }> {
	const { supabaseAdmin, gameId, playerId, userTurnHint, hintedActiveAgentIds = [], agents } = params;
	const allowedAgentIds = new Set(agents.map((agent) => agent.id));

	const { count } = await supabaseAdmin
		.from('discussion_messages')
		.select('id', { count: 'exact', head: true })
		.eq('game_id', gameId)
		.eq('round', 7)
		.eq('participant_type', 'human')
		.eq('participant_id', playerId);

	const merged = new Set<string>([TOP_MID_AGENT_ID]);
	for (const hinted of hintedActiveAgentIds) {
		if (allowedAgentIds.has(hinted)) merged.add(hinted);
	}

	if (hintedActiveAgentIds.length === 0) {
		const { data: aiRows } = await supabaseAdmin
			.from('discussion_messages')
			.select('metadata')
			.eq('game_id', gameId)
			.eq('round', 7)
			.eq('participant_type', 'ai_agent');

		for (const row of aiRows ?? []) {
			const agentId = (row as any)?.metadata?.agent_id;
			if (typeof agentId === 'string' && allowedAgentIds.has(agentId)) {
				merged.add(agentId);
			}
		}
	}

	const hintedTurn =
		typeof userTurnHint === 'number' && Number.isFinite(userTurnHint) && userTurnHint > 0
			? Math.max(1, Math.min(MAX_ROUND7_USER_TURNS, Math.floor(userTurnHint)))
			: null;

	return {
		userTurn: hintedTurn ?? Math.max(1, Math.min(MAX_ROUND7_USER_TURNS, Number(count ?? 1))),
		activeAgentIds: [TOP_MID_AGENT_ID, ...Array.from(merged).filter((id) => id !== TOP_MID_AGENT_ID)]
	};
}

export async function getNextTurnIndex(params: {
	supabaseAdmin: SupabaseAdmin;
	gameId: number;
	round: number;
	agentRole: AiAgentRole;
}): Promise<number> {
	const { supabaseAdmin, gameId, round, agentRole } = params;
	const { data, error } = await supabaseAdmin
		.from('discussion_messages')
		.select('turn_index')
		.eq('game_id', gameId)
		.eq('round', round)
		.eq('participant_type', 'ai_agent')
		.eq('agent_role', agentRole)
		.not('turn_index', 'is', null)
		.order('turn_index', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) return 1;
	const max = typeof (data as any)?.turn_index === 'number' ? Number((data as any).turn_index) : 0;
	return (Number.isFinite(max) ? max : 0) + 1;
}

export async function persistAiMessage(params: {
	supabaseAdmin: SupabaseAdmin;
	payload: Round7BatchRequest;
	requestId: string;
	agent: BatchAgent;
	content: string;
}): Promise<any | null> {
	const { supabaseAdmin, payload, requestId, agent, content } = params;
	const turnIndex = await getNextTurnIndex({
		supabaseAdmin,
		gameId: payload.gameId,
		round: payload.round,
		agentRole: agent.role
	});

	const { data, error } = await supabaseAdmin
		.from('discussion_messages')
		.insert({
			game_id: payload.gameId,
			proposal_id: payload.proposalId,
			round: payload.round,
			participant_type: 'ai_agent',
			participant_id: null,
			agent_role: agent.role,
			turn_index: turnIndex,
			content,
			metadata: {
				agent_id: agent.id,
				client_request_id: payload.clientRequestId ?? null,
				server_request_id: requestId
			}
		})
		.select()
		.single();
	if (error || !data) return null;
	return data;
}
