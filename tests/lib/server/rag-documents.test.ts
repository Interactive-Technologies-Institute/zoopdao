import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
	mkdtemp: vi.fn(async () => '/tmp/rag'),
	writeFile: vi.fn(async () => undefined),
	rm: vi.fn(async () => undefined)
}));

vi.mock('@langchain/core/documents', () => ({
	Document: class {
		pageContent: string;
		metadata: Record<string, unknown>;
		constructor(opts: { pageContent: string; metadata?: Record<string, unknown> }) {
			this.pageContent = opts.pageContent;
			this.metadata = opts.metadata ?? {};
		}
	}
}));

vi.mock('@langchain/textsplitters', () => ({
	RecursiveCharacterTextSplitter: class {
		async splitDocuments(docs: any[]) {
			return docs.map((doc) => ({ pageContent: `${doc.pageContent}-chunk`, metadata: doc.metadata }));
		}
	}
}));

const embedDocumentsMock = vi.fn(async (texts: string[]) =>
	texts.map(() => Array.from({ length: 1024 }, () => 0.02))
);

vi.mock('../../../src/lib/server/openrouter-embeddings', () => ({
	createOpenRouterEmbeddings: () => ({
		embedDocuments: embedDocumentsMock
	})
}));

const fromUpdateMock = vi.fn(async () => ({ error: null }));
const fromDeleteMock = vi.fn(async () => ({ error: null }));
const fromInsertChunksMock = vi.fn(async () => ({ error: null }));
const fromSelectDocMock = vi.fn(async () => ({
	data: {
		id: 55,
		proposal_id: 9,
		round: 7,
		filename: 'note.txt',
		storage_path: 'proposal-9/round-7/note.txt',
		metadata: { status: 'failed' }
	},
	error: null
}));

const fromMock = vi.fn((table: string) => {
	if (table === 'documents') {
		return {
			select: () => ({
				eq: () => ({
					single: fromSelectDocMock
				})
			}),
			update: () => ({
				eq: fromUpdateMock
			}),
			delete: () => ({
				eq: fromDeleteMock
			})
		};
	}

	if (table === 'document_chunks') {
		return {
			delete: () => ({
				eq: fromDeleteMock
			}),
			insert: fromInsertChunksMock
		};
	}

	throw new Error(`Unexpected table: ${table}`);
});

const downloadMock = vi.fn(async () => ({
	data: {
		arrayBuffer: async () => new TextEncoder().encode('hello world')
	},
	error: null
}));

const removeMock = vi.fn(async () => ({ data: null, error: null }));

vi.mock('../../../src/lib/server/supabase-admin', () => ({
	getSupabaseAdmin: () => ({
		from: fromMock,
		storage: {
			from: () => ({
				download: downloadMock,
				remove: removeMock
			})
		}
	})
}));

describe('rag document lifecycle', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('reindexes a document and updates chunks', async () => {
		const { reindexDocument } = await import('../../../src/lib/server/rag-ingest');
		const result = await reindexDocument(55);

		expect(result.documentId).toBe(55);
		expect(fromUpdateMock).toHaveBeenCalled();
		expect(fromDeleteMock).toHaveBeenCalled();
		expect(fromInsertChunksMock).toHaveBeenCalled();
		expect(embedDocumentsMock).toHaveBeenCalled();
	});

	it('deletes document record and storage object', async () => {
		const { deleteDocument } = await import('../../../src/lib/server/rag-ingest');
		await deleteDocument({ documentId: 55, storagePath: 'proposal-9/round-7/note.txt' });

		expect(removeMock).toHaveBeenCalledWith(['proposal-9/round-7/note.txt']);
		expect(fromDeleteMock).toHaveBeenCalled();
	});
});
