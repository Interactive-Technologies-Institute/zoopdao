import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { AI_AGENT_ROLES } from '$lib/ai/llm-types';
import { executeRound7PipelineV2 } from '$lib/server/ai-pipeline/round7/executor';

const agentSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	role: z.enum(AI_AGENT_ROLES)
});

const requestSchema = z.object({
	gameId: z.number().int().positive(),
	proposalId: z.number().int().positive().nullable(),
	round: z.literal(7),
	userId: z.string().min(1),
	locale: z.string().optional().nullable(),
	latestUserMessage: z.string().optional().nullable(),
	agents: z.array(agentSchema).min(1),
	activeAgentIds: z.array(z.string().min(1)).optional(),
	userTurnHint: z.number().int().positive().optional(),
	clientRequestId: z.string().optional()
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const payload = requestSchema.parse(body);
		const result = await executeRound7PipelineV2({
			payload: {
				gameId: payload.gameId,
				proposalId: payload.proposalId,
				round: 7,
				userId: payload.userId,
				locale: payload.locale ?? null,
				latestUserMessage: payload.latestUserMessage ?? null,
				agents: payload.agents,
				activeAgentIds: payload.activeAgentIds,
				userTurnHint: payload.userTurnHint,
				clientRequestId: payload.clientRequestId
			}
		});
		return json(result.body, { status: result.status });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{
					success: false,
					error: {
						code: 'invalid_request',
						message: error.issues[0]?.message ?? 'Invalid request payload.'
					}
				},
				{ status: 400 }
			);
		}

		console.error('[round7:v2] route_error', error);
		return json(
			{
				success: false,
				error: {
					code: 'server_error',
					message: 'Internal server error.'
				}
			},
			{ status: 500 }
		);
	}
};
