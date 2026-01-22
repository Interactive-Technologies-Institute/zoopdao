import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import type { Document } from '@langchain/core/documents';
import { getSupabaseAdmin } from './supabase-admin';
import { createOpenRouterEmbeddings } from './openrouter-embeddings';

export type RagRetrieveRequest = {
	query: string;
	proposalId: number;
	round: number;
	topK?: number;
};

export type RagChunkResult = {
	content: string;
	similarity: number;
	metadata: Record<string, unknown>;
};

function normalizeMetadata(metadata: Document['metadata']): Record<string, unknown> {
	if (!metadata || typeof metadata !== 'object') {
		return {};
	}
	return metadata as Record<string, unknown>;
}

export async function retrieveRagChunks({
	query,
	proposalId,
	round,
	topK = 6
}: RagRetrieveRequest): Promise<RagChunkResult[]> {
	const supabaseAdmin = getSupabaseAdmin();
	const embeddings = createOpenRouterEmbeddings();
	const store = new SupabaseVectorStore(embeddings, {
		client: supabaseAdmin,
		tableName: 'document_chunks',
		queryName: 'match_documents'
	});

	const filter = { proposal_id: proposalId, round };
	const results = await store.similaritySearchWithScore(query, topK, filter);

	return results.map(([doc, score]) => ({
		content: doc.pageContent,
		similarity: score,
		metadata: normalizeMetadata(doc.metadata)
	}));
}
