import type { SupabaseClient } from '@supabase/supabase-js';

export interface DiscussionMessage {
	id: number;
	gameId: number;
	proposalId: number | null;
	round: number;
	participantType: 'human' | 'ai_agent';
	participantId: number | null;
	agentRole: 'administration' | 'research' | 'reception' | 'operations' | 'bar' | 'cleaning' | null;
	content: string;
	createdAt: string;
	metadata: Record<string, any>;
}

/**
 * Fetch discussion messages for a game
 */
export async function getDiscussionMessages(
	supabase: SupabaseClient,
	gameId: number,
	options?: {
		round?: number;
		participantType?: 'human' | 'ai_agent';
		limit?: number;
		offset?: number;
	}
): Promise<DiscussionMessage[]> {
	let query = supabase
		.from('discussion_messages')
		.select('*')
		.eq('game_id', gameId)
		.order('created_at', { ascending: true });

	if (options?.round !== undefined) {
		query = query.eq('round', options.round);
	}

	if (options?.participantType) {
		query = query.eq('participant_type', options.participantType);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	if (options?.offset) {
		query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching discussion messages:', error);
		return [];
	}

	return (data || []).map((msg) => ({
		id: msg.id,
		gameId: msg.game_id,
		proposalId: msg.proposal_id,
		round: msg.round,
		participantType: msg.participant_type,
		participantId: msg.participant_id,
		agentRole: msg.agent_role,
		content: msg.content,
		createdAt: msg.created_at,
		metadata: msg.metadata || {}
	}));
}

/**
 * Fetch discussion messages for a proposal
 */
export async function getProposalMessages(
	supabase: SupabaseClient,
	proposalId: number,
	options?: {
		round?: number;
		limit?: number;
		offset?: number;
	}
): Promise<DiscussionMessage[]> {
	let query = supabase
		.from('discussion_messages')
		.select('*')
		.eq('proposal_id', proposalId)
		.order('created_at', { ascending: true });

	if (options?.round !== undefined) {
		query = query.eq('round', options.round);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	if (options?.offset) {
		query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching proposal messages:', error);
		return [];
	}

	return (data || []).map((msg) => ({
		id: msg.id,
		gameId: msg.game_id,
		proposalId: msg.proposal_id,
		round: msg.round,
		participantType: msg.participant_type,
		participantId: msg.participant_id,
		agentRole: msg.agent_role,
		content: msg.content,
		createdAt: msg.created_at,
		metadata: msg.metadata || {}
	}));
}

/**
 * Store a human participant message
 */
export async function storeHumanMessage(
	supabase: SupabaseClient,
	gameId: number,
	proposalId: number | null,
	round: number,
	participantId: number,
	content: string
): Promise<DiscussionMessage | null> {
	const { data, error } = await supabase
		.from('discussion_messages')
		.insert({
			game_id: gameId,
			proposal_id: proposalId,
			round: round,
			participant_type: 'human',
			participant_id: participantId,
			content: content
		})
		.select()
		.single();

	if (error) {
		console.error('Error storing human message:', error);
		return null;
	}

	return {
		id: data.id,
		gameId: data.game_id,
		proposalId: data.proposal_id,
		round: data.round,
		participantType: data.participant_type,
		participantId: data.participant_id,
		agentRole: data.agent_role,
		content: data.content,
		createdAt: data.created_at,
		metadata: data.metadata || {}
	};
}

/**
 * Store an AI agent message
 */
export async function storeAIMessage(
	supabase: SupabaseClient,
	gameId: number,
	proposalId: number | null,
	round: number,
	agentId: string,
	agentRole: 'administration' | 'research' | 'reception' | 'operations' | 'bar' | 'cleaning',
	content: string,
	options?: {
		turnIndex?: number | null;
	}
): Promise<DiscussionMessage | null> {
	const { data, error } = await supabase
		.from('discussion_messages')
		.insert({
			game_id: gameId,
			proposal_id: proposalId,
			round: round,
			participant_type: 'ai_agent',
			participant_id: null,
			agent_role: agentRole,
			turn_index: options?.turnIndex ?? null,
			content: content,
			metadata: { agent_id: agentId }
		})
		.select()
		.single();

	if (error) {
		console.error('Error storing AI message:', error);
		return null;
	}

	return {
		id: data.id,
		gameId: data.game_id,
		proposalId: data.proposal_id,
		round: data.round,
		participantType: data.participant_type,
		participantId: data.participant_id,
		agentRole: data.agent_role,
		content: data.content,
		createdAt: data.created_at,
		metadata: data.metadata || {}
	};
}

/**
 * Get chat history formatted for AI context
 */
export async function getChatHistoryForAI(
	supabase: SupabaseClient,
	gameId: number,
	currentRound: number,
	limit: number = 20
): Promise<Array<{ content: string; senderType: 'human' | 'ai'; senderName: string; round: number }>> {
	const messages = await getDiscussionMessages(supabase, gameId, {
		limit: limit,
		offset: 0
	});

	return messages
		.filter(msg => msg.round <= currentRound) // Include current round messages
		.map(msg => ({
			content: msg.content,
			senderType: msg.participantType === 'human' ? 'human' : 'ai',
			senderName: msg.participantType === 'human' 
				? 'Participant' 
				: (msg.agentRole ? msg.agentRole.charAt(0).toUpperCase() + msg.agentRole.slice(1) : 'AI Agent'),
			round: msg.round
		}));
}
