import { describe, expect, it, vi } from 'vitest';

type SupabaseRpcResult = { data: unknown; error: { message: string } | null };

function makeSupabaseAdmin(params: {
	playerExists?: boolean;
	usedCount?: number | null;
	rpcAllowed?: boolean;
	rpcRemaining?: number;
}) {
	const playerExists = params.playerExists ?? true;
	const usedCount = params.usedCount ?? null;
	const rpcAllowed = params.rpcAllowed ?? true;
	const rpcRemaining = params.rpcRemaining ?? 2;

	return {
		rpc: vi.fn(async () => {
			const result: SupabaseRpcResult = {
				data: [{ allowed: rpcAllowed, used_count: rpcAllowed ? 1 : 3, remaining: rpcRemaining }],
				error: null
			};
			return result;
		}),
		from: (table: string) => {
			const query: any = {
				select: () => query,
				eq: () => query,
				gte: () => query,
				lte: () => query
			};

			query.maybeSingle = async () => {
				if (table === 'players') {
					return {
						data: playerExists ? { id: 1, is_active: true } : null,
						error: null
					};
				}
				return { data: null, error: null };
			};

			query.then = (resolve: any, reject?: any) => {
				if (table === 'assistant_question_usage') {
					const rows = usedCount === null ? [] : [{ used_count: usedCount, round: 2 }];
					return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
				}
				return Promise.resolve({ data: [], error: null }).then(resolve, reject);
			};

			return query;
		}
	};
}

async function loadHandler(params: {
	playerExists?: boolean;
	usedCount?: number | null;
	rpcAllowed?: boolean;
	rpcRemaining?: number;
	aiContent?: string;
}) {
	vi.resetModules();
	const supabaseAdmin = makeSupabaseAdmin(params);

	vi.doMock('$lib/server/supabase-admin', () => ({
		getSupabaseAdmin: () => supabaseAdmin
	}));

	vi.doMock('$lib/server/ai-context', () => ({
		buildAssistantContext: vi.fn(async () => ({
			organizationName: 'Org',
			player: { nickname: 'Nick', role: 'research' },
			proposalPointText: 'BEGIN UNTRUSTED PROPOSAL_POINT\nPoint\nEND UNTRUSTED PROPOSAL_POINT',
			promptSizes: { proposalPointChars: 10 }
		}))
	}));

	vi.doMock('$lib/ai/providers/iaedu', () => ({
		generateAIMessageIaedu: vi.fn(async () => ({
			success: true,
			provider: 'iaedu',
			model: 'iaedu',
			message: {
				content: params.aiContent ?? 'What is your main concern?',
				agentRole: 'research',
				round: 1
			}
		}))
	}));

	vi.doMock('$lib/server/ai-observability', () => ({
		createRequestId: () => 'req-test',
		logAiEvent: vi.fn(),
		persistAiAudit: vi.fn()
	}));

	return import('../../../../src/routes/api/ai/assistant/+server');
}

describe('/api/ai/assistant', () => {
	it('GET returns remaining count (defaults to 3 when unused)', async () => {
		const { GET } = await loadHandler({ usedCount: null });
		const res = await GET({ url: new URL('http://localhost/api/ai/assistant?gameId=1&round=2&userId=u1') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.remaining).toBe(3);
	});

	it('POST returns limitReached when quota is exhausted', async () => {
		const { POST } = await loadHandler({ rpcAllowed: false, rpcRemaining: 0 });
		const req = new Request('http://localhost/api/ai/assistant', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ gameId: 1, proposalId: 2, round: 3, userId: 'u1' })
		});
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.limitReached).toBe(true);
		expect(body.remaining).toBe(0);
		expect(body.question).toBeNull();
	});

	it('POST returns a validated one-sentence question and remaining quota', async () => {
		const { POST } = await loadHandler({ rpcAllowed: true, rpcRemaining: 2, aiContent: 'What matters most here?' });
		const req = new Request('http://localhost/api/ai/assistant', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ gameId: 1, proposalId: 2, round: 3, userId: 'u1' })
		});
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.limitReached).toBe(false);
		expect(body.remaining).toBe(2);
		expect(body.question).toBe('What matters most here?');
	});

	it('rejects requests when user is not a player in the game', async () => {
		const { POST } = await loadHandler({ playerExists: false });
		const req = new Request('http://localhost/api/ai/assistant', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ gameId: 1, proposalId: 2, round: 3, userId: 'u1' })
		});
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error?.code).toBe('unauthorized');
	});
});
