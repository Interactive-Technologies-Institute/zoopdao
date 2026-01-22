import { describe, expect, it, vi } from 'vitest';

const similaritySearchWithScore = vi.fn();
const capturedOptions: Array<Record<string, unknown>> = [];

class FakeSupabaseVectorStore {
	constructor(_: unknown, options: Record<string, unknown>) {
		capturedOptions.push(options);
	}

	similaritySearchWithScore = similaritySearchWithScore;
}

vi.mock('@langchain/community/vectorstores/supabase', () => ({
	SupabaseVectorStore: FakeSupabaseVectorStore
}));

vi.mock('../../../src/lib/server/openrouter-embeddings', () => ({
	createOpenRouterEmbeddings: vi.fn(() => ({ embedQuery: vi.fn() }))
}));

vi.mock('../../../src/lib/server/supabase-admin', () => ({
	getSupabaseAdmin: vi.fn(() => ({ fake: true }))
}));

describe('retrieveRagChunks', () => {
	it('passes proposal/round filter and returns chunk results with similarity', async () => {
		similaritySearchWithScore.mockResolvedValueOnce([
			[
				{
					pageContent: 'Chunk content',
					metadata: {
						proposal_id: 9,
						round: 7,
						filename: 'doc.pdf'
					}
				},
				0.82
			]
		]);

		const { retrieveRagChunks } = await import('../../../src/lib/server/rag-retrieve');
		const results = await retrieveRagChunks({
			query: 'test query',
			proposalId: 9,
			round: 7,
			topK: 3
		});

		expect(capturedOptions[0]).toMatchObject({
			tableName: 'document_chunks',
			queryName: 'match_documents'
		});
		expect(similaritySearchWithScore).toHaveBeenCalledWith('test query', 3, {
			proposal_id: 9,
			round: 7
		});
		expect(results).toEqual([
			{
				content: 'Chunk content',
				similarity: 0.82,
				metadata: {
					proposal_id: 9,
					round: 7,
					filename: 'doc.pdf'
				}
			}
		]);
	});
});
