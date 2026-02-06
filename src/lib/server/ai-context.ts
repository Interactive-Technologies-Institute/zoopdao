import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiChatMessage } from '$lib/ai/llm-types';
import { ORGANIZATION_NAME } from '$lib/config/organization';
import { retrieveRagChunks } from '$lib/server/rag-retrieve';
import { buildRagContext, RAG_CONTEXT_MAX_CHARS, RAG_CONTEXT_MAX_CHUNKS } from '$lib/server/rag-context';
import {
	getFullProposalText,
	getProposalContextUpToRound,
	getProposalTextForRound,
	type ProposalLike
} from '$lib/utils/proposal-points';
import { getOrUpdateRollingSummary } from '$lib/server/ai-summary';

const PROPOSAL_POINT_MAX_CHARS = 1200;
const PROPOSAL_FULL_MAX_CHARS = 2400;
const PROPOSAL_CONTEXT_MAX_CHARS = 2000;
const CHAT_HISTORY_MAX_CHARS = 2600;

export type PlayerContext = {
	nickname: string | null;
	role: string | null;
};

export type ProposalContext = {
	proposalPointText: string | null;
	proposalFullText: string | null;
};

export type Round7Context = {
	organizationName: string;
	proposalContext: string | null;
	discussionSummary: string | null;
	chatHistory: AiChatMessage[];
	ragContext: string | null;
	ragChunkCount: number;
	summaryUsed: boolean;
	promptSizes: Record<string, number>;
};

export type AssistantContext = {
	organizationName: string;
	player: PlayerContext;
	proposalPointText: string | null;
	proposalContextText: string | null;
	promptSizes: Record<string, number>;
};

function clamp(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;
	return text.slice(0, maxChars).trimEnd();
}

function toTitleCaseRole(role: string) {
	return role.charAt(0).toUpperCase() + role.slice(1);
}

function normalizeChatHistory(messages: AiChatMessage[], maxChars: number): AiChatMessage[] {
	let used = 0;
	const kept: AiChatMessage[] = [];

	// Keep most recent messages, but preserve chronological order in output.
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const msg = messages[i];
		const lineCost = msg.content.length + msg.senderName.length + 32;
		if (used + lineCost > maxChars) break;
		used += lineCost;
		kept.push(msg);
	}

	return kept.reverse();
}

async function fetchPlayerContext(
	supabaseAdmin: SupabaseClient,
	gameId: number,
	userId: string
): Promise<PlayerContext> {
	try {
		const { data } = await supabaseAdmin
			.from('players')
			.select('nickname, role')
			.eq('game_id', gameId)
			.eq('user_id', userId)
			.maybeSingle();
		return {
			nickname: (data as any)?.nickname ?? null,
			role: (data as any)?.role ?? null
		};
	} catch {
		return { nickname: null, role: null };
	}
}

async function fetchProposalContext(
	supabaseAdmin: SupabaseClient,
	proposalId: number | null,
	round: number
): Promise<ProposalContext> {
	if (!proposalId) {
		return { proposalPointText: null, proposalFullText: null };
	}

	const { data, error } = await supabaseAdmin
		.from('proposals')
		.select('title, objectives, functionalities')
		.eq('id', proposalId)
		.maybeSingle();

	if (error || !data) {
		return { proposalPointText: null, proposalFullText: null };
	}

	const proposal = data as unknown as ProposalLike;
	const proposalPointRaw = round >= 0 && round <= 6 ? getProposalTextForRound(proposal, round) : '';
	const proposalPointText = proposalPointRaw ? clamp(proposalPointRaw, PROPOSAL_POINT_MAX_CHARS) : null;

	const proposalContextRaw = round >= 1 && round <= 6 ? getProposalContextUpToRound(proposal, round) : '';
	const proposalContextText = proposalContextRaw
		? clamp(proposalContextRaw, PROPOSAL_CONTEXT_MAX_CHARS)
		: null;

	const proposalFullRaw = getFullProposalText(proposal);
	const proposalFullText = proposalFullRaw ? clamp(proposalFullRaw, PROPOSAL_FULL_MAX_CHARS) : null;

	return { proposalPointText, proposalContextText, proposalFullText };
}

type DiscussionRow = {
	id: number;
	round: number;
	participant_type: 'human' | 'ai_agent';
	agent_role: string | null;
	content: string;
	created_at: string;
	metadata: any;
};

async function fetchRecentDiscussionRows(params: {
	supabaseAdmin: SupabaseClient;
	gameId: number;
	round: number;
	limit: number;
}): Promise<DiscussionRow[]> {
	const { supabaseAdmin, gameId, round, limit } = params;
	const { data, error } = await supabaseAdmin
		.from('discussion_messages')
		.select('id, round, participant_type, agent_role, content, created_at, metadata')
		.eq('game_id', gameId)
		.eq('round', round)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error || !data) return [];
	return (data as DiscussionRow[]).slice().reverse();
}

function mapRowsToChatHistory(rows: DiscussionRow[]): AiChatMessage[] {
	return rows.map((row) => {
		const senderType = row.participant_type === 'human' ? 'human' : 'ai';
		const senderName =
			senderType === 'human'
				? 'Participant'
				: row.agent_role
					? toTitleCaseRole(row.agent_role)
					: 'AI Agent';
		return {
			content: (row.content ?? '').trim(),
			senderType,
			senderName,
			round: row.round
		};
	});
}

function wrapUntrusted(label: string, content: string): string {
	return `BEGIN UNTRUSTED ${label}\n${content}\nEND UNTRUSTED ${label}`;
}

export async function buildAssistantContext(params: {
	supabaseAdmin: SupabaseClient;
	gameId: number;
	proposalId: number | null;
	round: number;
	userId: string;
}): Promise<AssistantContext> {
	const { supabaseAdmin, gameId, proposalId, round, userId } = params;
	const player = await fetchPlayerContext(supabaseAdmin, gameId, userId);
	const proposal = await fetchProposalContext(supabaseAdmin, proposalId, round);

	const proposalPointText = proposal.proposalPointText
		? wrapUntrusted('PROPOSAL_POINT', proposal.proposalPointText)
		: null;
	const proposalContextText = proposal.proposalContextText
		? wrapUntrusted('PROPOSAL_CONTEXT', proposal.proposalContextText)
		: null;

	return {
		organizationName: ORGANIZATION_NAME,
		player,
		proposalPointText,
		proposalContextText,
		promptSizes: {
			proposalPointChars: proposalPointText?.length ?? 0,
			proposalContextChars: proposalContextText?.length ?? 0
		}
	};
}

export async function buildRound7Context(params: {
	supabaseAdmin: SupabaseClient;
	gameId: number;
	proposalId: number | null;
	userId: string;
	latestUserMessage: string | null;
	recentWindowLimit?: number;
}): Promise<Round7Context> {
	const {
		supabaseAdmin,
		gameId,
		proposalId,
		userId,
		latestUserMessage,
		recentWindowLimit = 20
	} = params;

	const proposal = await fetchProposalContext(supabaseAdmin, proposalId, 7);
	const proposalContext = proposal.proposalFullText
		? wrapUntrusted('PROPOSAL_CONTEXT', proposal.proposalFullText)
		: null;

	const recentRows = await fetchRecentDiscussionRows({
		supabaseAdmin,
		gameId,
		round: 7,
		limit: recentWindowLimit
	});
	const boundaryId = recentRows[0]?.id ?? 0;

	let discussionSummary: string | null = null;
	let summaryUsed = false;
	if (boundaryId) {
		const summaryResult = await getOrUpdateRollingSummary({
			supabaseAdmin,
			gameId,
			round: 7,
			boundaryMessageId: boundaryId,
			userId
		});
		discussionSummary = summaryResult.summary
			? wrapUntrusted('DISCUSSION_SUMMARY', clamp(summaryResult.summary, 1200))
			: null;
		summaryUsed = summaryResult.summaryUsed;
	}

	const chatHistory = normalizeChatHistory(mapRowsToChatHistory(recentRows), CHAT_HISTORY_MAX_CHARS).map(
		(msg) => ({
			...msg,
			content: wrapUntrusted('DISCUSSION_MESSAGE', msg.content)
		})
	);

	let ragContext: string | null = null;
	let ragChunkCount = 0;
	if (proposalId && latestUserMessage && latestUserMessage.trim()) {
		try {
			const chunks = await retrieveRagChunks({
				query: latestUserMessage.trim(),
				proposalId,
				round: 7,
				userId,
				topK: RAG_CONTEXT_MAX_CHUNKS
			});
			ragChunkCount = chunks.length;
			if (chunks.length > 0) {
				ragContext = wrapUntrusted('RAG_CONTEXT', buildRagContext(chunks, RAG_CONTEXT_MAX_CHARS));
			}
		} catch {
			ragContext = null;
			ragChunkCount = 0;
		}
	}

	const promptSizes: Record<string, number> = {
		proposalContextChars: proposalContext?.length ?? 0,
		summaryChars: discussionSummary?.length ?? 0,
		historyChars: chatHistory.reduce((acc, msg) => acc + msg.content.length, 0),
		ragChars: ragContext?.length ?? 0
	};

	return {
		organizationName: ORGANIZATION_NAME,
		proposalContext,
		discussionSummary,
		chatHistory,
		ragContext,
		ragChunkCount,
		summaryUsed,
		promptSizes
	};
}
