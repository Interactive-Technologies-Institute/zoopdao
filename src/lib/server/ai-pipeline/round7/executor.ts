import {
	ENABLE_ROUND7_PIPELINE_V2,
	ROUND7_PIPELINE_LOG_LEVEL_DEFAULT
} from '$lib/config/feature-flags';
import { createRequestId, persistAiAudit } from '$lib/server/ai-observability';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';
import { createRound7PipelineLogger } from './logger';
import {
	buildContext,
	fetchExistingByClientRequestId,
	persistAiMessage,
	resolveOrCreateProviderThreadId,
	resolveActivePlayer,
	resolveRound7State,
	validateGameProposal
} from './context';
import { sendOne } from './provider';
import { buildProviderErrorResponse, buildSuccessResponse } from './response';
import { buildAquariOnlyScenePlan } from './routing';
import type {
	BatchAgent,
	OutputMessage,
	ProviderFailure,
	Round7BatchRequest,
	Round7PipelineConfig,
	Round7PipelineHttpResult,
	Round7PipelineLogLevel
} from './types';

const ROUND7_ROUTING_MODE = 'aquari_only' as const;
const ROUND7_FAIL_MODE = 'hard_error' as const;

export function getRound7PipelineConfig(): Round7PipelineConfig {
	return {
		enabled: ENABLE_ROUND7_PIPELINE_V2,
		logLevel: ROUND7_PIPELINE_LOG_LEVEL_DEFAULT as Round7PipelineLogLevel
	};
}

function rowToMessage(row: any, agent: BatchAgent): OutputMessage {
	return {
		agentId: agent.id,
		agentName: agent.name,
		agentRole: agent.role,
		round: row.round,
		content: row.content,
		dbId: row.id,
		createdAt: row.created_at
	};
}

export async function executeRound7PipelineV2(params: {
	payload: Round7BatchRequest;
	requestId?: string;
	startedAt?: number;
}): Promise<Round7PipelineHttpResult> {
	const requestId = params.requestId ?? createRequestId();
	const startedAt = params.startedAt ?? Date.now();
	const config = getRound7PipelineConfig();
	const log = createRound7PipelineLogger({ requestId, level: config.logLevel });
	const supabaseAdmin = getSupabaseAdmin();

	log.step('request_received', {
		gameId: params.payload.gameId,
		proposalId: params.payload.proposalId,
		round: params.payload.round,
		agentsCount: params.payload.agents.length,
		routingMode: ROUND7_ROUTING_MODE,
		failMode: ROUND7_FAIL_MODE
	});

	const payload = params.payload;
	const latestUserMessage = (payload.latestUserMessage ?? '').trim();
	const locale = payload.locale ?? null;

	const playerId = await resolveActivePlayer({
		supabaseAdmin,
		gameId: payload.gameId,
		userId: payload.userId
	});
	if (!playerId) {
		log.warn('authorization_failed', { userId: payload.userId });
		return {
			status: 403,
			body: {
				success: false,
				error: { code: 'unauthorized', message: 'Not a participant.', requestId }
			}
		};
	}

	if (payload.proposalId) {
		const validProposal = await validateGameProposal({
			supabaseAdmin,
			gameId: payload.gameId,
			proposalId: payload.proposalId
		});
		if (!validProposal) {
			log.warn('proposal_validation_failed', { proposalId: payload.proposalId });
			return {
				status: 400,
				body: {
					success: false,
					error: { code: 'invalid_request', message: 'Proposal does not match game.', requestId }
				}
			};
		}
	}

	const existingRows = await fetchExistingByClientRequestId({
		supabaseAdmin,
		gameId: payload.gameId,
		round: payload.round,
		clientRequestId: payload.clientRequestId
	});
	const existingByAgentId = new Map<string, any>();
	for (const row of existingRows) {
		const agentId = row?.metadata?.agent_id;
		if (typeof agentId === 'string' && agentId) existingByAgentId.set(agentId, row);
	}
	log.step('idempotency_checked', {
		clientRequestId: payload.clientRequestId ?? null,
		existingRows: existingRows.length
	});

	const context = await buildContext({
		supabaseAdmin,
		payload,
		latestUserMessage
	});
	log.step('context_built', {
		chatHistoryCount: context.chatHistory.length,
		ragChunkCount: context.ragChunkCount,
		summaryUsed: context.summaryUsed
	});

	const providerThreadId = await resolveOrCreateProviderThreadId({
		supabaseAdmin,
		gameId: payload.gameId,
		round: payload.round,
		userId: payload.userId,
		provider: 'iaedu'
	});
	if (!providerThreadId) {
		log.error('thread_resolution_failed', { provider: 'iaedu' });
		return {
			status: 500,
			body: {
				success: false,
				error: {
					code: 'server_error',
					message: 'Unable to resolve provider thread.',
					requestId
				}
			}
		};
	}
	log.step('thread_resolved', { provider: 'iaedu', threadSuffix: providerThreadId.slice(-8) });

	const state = await resolveRound7State({
		supabaseAdmin,
		gameId: payload.gameId,
		playerId,
		userTurnHint: payload.userTurnHint,
		hintedActiveAgentIds: payload.activeAgentIds,
		agents: payload.agents
	});
	log.step('routing_selected', {
		userTurn: state.userTurn,
		mode: ROUND7_ROUTING_MODE
	});

	// Stabilization mode: always route to Aquari/top-mid.
	const scenePlan = buildAquariOnlyScenePlan({
		userTurn: state.userTurn,
		agents: payload.agents,
		activeAgentIds: state.activeAgentIds
	});

	const agentById = new Map(payload.agents.map((agent) => [agent.id, agent]));
	const speakingAgents = scenePlan.speakingOrder
		.map((agentId) => agentById.get(agentId))
		.filter(Boolean) as BatchAgent[];

	const toGenerate = speakingAgents.filter((agent) => !existingByAgentId.has(agent.id));
	const errors: ProviderFailure[] = [];

	for (const agent of toGenerate) {
		log.step('provider_request', { agentId: agent.id, agentName: agent.name });
		const result = await sendOne({
			gameId: payload.gameId,
			proposalId: payload.proposalId,
			userId: payload.userId,
			providerThreadId,
			round: payload.round,
			locale,
			latestUserMessage,
			agent,
			context
		});
		if (!result.ok) {
			const providerError = {
				agentId: agent.id,
				code: result.error.code,
				message: result.error.message,
				details: result.error.details ? String(result.error.details).slice(0, 600) : null
			};
			errors.push(providerError);
			log.warn('provider_result', { agentId: agent.id, ok: false, code: result.error.code });
			continue;
		}

		const persisted = await persistAiMessage({
			supabaseAdmin,
			payload,
			requestId,
			agent,
			content: result.content
		});

		if (!persisted) {
			errors.push({
				agentId: agent.id,
				code: 'store_failed',
				message: 'Failed to store AI message.',
				details: null
			});
			log.warn('persist_failed', { agentId: agent.id });
			continue;
		}
		existingByAgentId.set(agent.id, persisted);
		log.step('persist_success', { agentId: agent.id, dbId: persisted.id });
	}

	const messages = speakingAgents
		.map((agent) => {
			const row = existingByAgentId.get(agent.id);
			return row ? rowToMessage(row, agent) : null;
		})
		.filter(Boolean) as OutputMessage[];

	if (errors.length > 0 && ROUND7_FAIL_MODE === 'hard_error' && messages.length === 0) {
		scenePlan.errorMode = 'hard_error';
		await persistAiAudit({
			requestId,
			endpoint: '/api/ai/messages/batch',
			gameId: payload.gameId,
			proposalId: payload.proposalId,
			round: payload.round,
			provider: 'iaedu',
			model: 'iaedu',
			success: false,
			errorCode: 'provider_error',
			latencyMs: Date.now() - startedAt,
			promptSizes: context.promptSizes,
			ragChunks: context.ragChunkCount,
			summaryUsed: context.summaryUsed,
			validationFailures: {
				errors: errors.slice(0, 5),
				routing_mode: ROUND7_ROUTING_MODE,
				pipeline_mode: 'text_only'
			}
		});
		log.error('response_sent', { status: 502, errorsCount: errors.length });
		return buildProviderErrorResponse({
			requestId,
			scenePlan,
			summaryUsed: context.summaryUsed,
			errors,
			message: 'Model error; please try again.'
		});
	}

	scenePlan.errorMode = errors.length > 0 ? 'hard_error' : 'none';
	await persistAiAudit({
		requestId,
		endpoint: '/api/ai/messages/batch',
		gameId: payload.gameId,
		proposalId: payload.proposalId,
		round: payload.round,
		provider: 'iaedu',
		model: 'iaedu',
		success: errors.length === 0,
		errorCode: errors.length ? 'partial_failure' : null,
		latencyMs: Date.now() - startedAt,
		promptSizes: context.promptSizes,
		ragChunks: context.ragChunkCount,
		summaryUsed: context.summaryUsed,
		validationFailures: errors.length
			? {
					errors: errors.slice(0, 5),
					routing_mode: ROUND7_ROUTING_MODE,
					pipeline_mode: 'text_only'
				}
			: null
	});
	log.step('response_sent', {
		status: 200,
		messagesCount: messages.length,
		errorsCount: errors.length,
		errorMode: scenePlan.errorMode
	});
	return buildSuccessResponse({
		requestId,
		scenePlan,
		summaryUsed: context.summaryUsed,
		messages,
		errors
	});
}
