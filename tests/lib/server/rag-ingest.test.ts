import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IngestRequestPayload } from '../../../src/lib/server/rag-ingest';

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
	texts.map(() => Array.from({ length: 1024 }, () => 0.01))
);

vi.mock('../../../src/lib/server/openrouter-embeddings', () => ({
	createOpenRouterEmbeddings: () => ({
		embedDocuments: embedDocumentsMock
	})
}));

const fromInsertMock = vi.fn(async () => ({
	data: { id: 123 },
	error: null
}));
const fromCountMock = vi.fn(async () => ({
	count: 0,
	error: null
}));
const fromUpdateMock = vi.fn(async () => ({
	error: null
}));
const fromChunksInsertMock = vi.fn(async () => ({
	error: null
}));

const fromMock = vi.fn((table: string) => {
	if (table === 'documents') {
		return {
			select: () => ({
				eq: () => ({
					eq: fromCountMock
				})
			}),
			insert: () => ({
				select: () => ({
					single: fromInsertMock
				})
			}),
			update: () => ({
				eq: fromUpdateMock
			})
		};
	}

	if (table === 'document_chunks') {
		return {
			insert: fromChunksInsertMock
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

vi.mock('../../../src/lib/server/supabase-admin', () => ({
	getSupabaseAdmin: () => ({
		from: fromMock,
		storage: {
			from: () => ({
				download: downloadMock
			})
		}
	})
}));

vi.mock('@langchain/community/document_loaders/fs/pdf', () => ({
	PDFLoader: class {
		constructor(_path: string) {}
		async load() {
			return [{ pageContent: 'pdf content', metadata: {} }];
		}
	}
}));

describe('ingestDocuments', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('stores chunks and updates document metadata', async () => {
		const { ingestDocuments } = await import('../../../src/lib/server/rag-ingest');
		const payload: IngestRequestPayload = {
			proposalId: 9,
			round: 7,
			userId: 'user-1',
			files: [
				{
					storagePath: 'proposal-9/round-7/test.pdf',
					filename: 'test.pdf',
					mimeType: 'application/pdf',
					sizeBytes: 12
				}
			]
		};

		const results = await ingestDocuments(payload);

		expect(results[0].status).toBe('indexed');
		expect(fromInsertMock).toHaveBeenCalled();
		expect(fromChunksInsertMock).toHaveBeenCalled();
		expect(fromUpdateMock).toHaveBeenCalled();
		expect(embedDocumentsMock).toHaveBeenCalled();
	});

	it('rejects uploads that exceed the per-round limit', async () => {
		fromCountMock.mockResolvedValueOnce({ count: 5, error: null });
		const { ingestDocuments } = await import('../../../src/lib/server/rag-ingest');
		const payload: IngestRequestPayload = {
			proposalId: 9,
			round: 7,
			userId: 'user-1',
			files: [
				{
					storagePath: 'proposal-9/round-7/test.pdf',
					filename: 'test.pdf',
					mimeType: 'application/pdf',
					sizeBytes: 12
				}
			]
		};

		await expect(ingestDocuments(payload)).rejects.toThrow('upload-limit-exceeded');
	});
});
