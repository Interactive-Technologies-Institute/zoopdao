import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_BASE_URL,
	OPENROUTER_EMBEDDING_MODEL,
	OPENROUTER_SITE_URL,
	OPENROUTER_APP_NAME
} from '$env/static/private';
import { getSupabaseAdmin } from './supabase-admin';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const DOCUMENTS_BUCKET = 'discussion-documents';
const DEFAULT_EMBEDDING_MODEL = OPENROUTER_EMBEDDING_MODEL || 'baai/bge-m3';
const DEFAULT_BASE_URL = OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

function buildOpenRouterHeaders() {
	const headers: Record<string, string> = {};
	if (OPENROUTER_SITE_URL) {
		headers['HTTP-Referer'] = OPENROUTER_SITE_URL;
	}
	if (OPENROUTER_APP_NAME) {
		headers['X-Title'] = OPENROUTER_APP_NAME;
	}
	return headers;
}

export interface IngestFilePayload {
	storagePath: string;
	filename: string;
	mimeType?: string | null;
	sizeBytes?: number | null;
}

export interface IngestRequestPayload {
	proposalId: number;
	round: number;
	userId?: string | null;
	files: IngestFilePayload[];
}

type IngestResult = {
	storagePath: string;
	documentId?: number;
	status: 'indexed' | 'failed';
	error?: string;
	chunkCount?: number;
};

async function loadWithTempFile<T>(
	buffer: Buffer,
	extension: string,
	loader: (filePath: string) => Promise<T>
): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), 'rag-upload-'));
	const filePath = join(dir, `upload${extension}`);
	try {
		await writeFile(filePath, buffer);
		return await loader(filePath);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

async function loadDocumentsFromBuffer(
	buffer: Buffer,
	filename: string,
	extension: string
): Promise<Document[]> {
	if (extension === '.txt' || extension === '.md') {
		return [
			new Document({
				pageContent: buffer.toString('utf-8'),
				metadata: { source: filename }
			})
		];
	}

	if (extension === '.pdf') {
		return loadWithTempFile(buffer, extension, async (filePath) => {
			const module = await import('@langchain/community/document_loaders/fs/pdf');
			const Loader = (module as any).PDFLoader;
			if (!Loader) {
				throw new Error('PDFLoader is not available.');
			}
			const loader = new Loader(filePath);
			return loader.load();
		});
	}

	if (extension === '.docx') {
		return loadWithTempFile(buffer, extension, async (filePath) => {
			const module = await import('@langchain/community/document_loaders/fs/docx');
			const Loader = (module as any).DocxLoader;
			if (!Loader) {
				throw new Error('DocxLoader is not available.');
			}
			const loader = new Loader(filePath);
			return loader.load();
		});
	}

	if (extension === '.pptx') {
		return loadWithTempFile(buffer, extension, async (filePath) => {
			const module = await import('@langchain/community/document_loaders/fs/pptx');
			const Loader = (module as any).PptxLoader ?? (module as any).PPTXLoader;
			if (!Loader) {
				throw new Error('PptxLoader is not available.');
			}
			const loader = new Loader(filePath);
			return loader.load();
		});
	}

	if (extension === '.xlsx') {
		return loadWithTempFile(buffer, extension, async (filePath) => {
			const module = await import('@langchain/community/document_loaders/fs/xlsx');
			const Loader = (module as any).XLSXLoader ?? (module as any).XlsxLoader;
			if (!Loader) {
				throw new Error('XLSXLoader is not available.');
			}
			const loader = new Loader(filePath);
			return loader.load();
		});
	}

	throw new Error(`Unsupported file type: ${extension}`);
}

export async function ingestDocuments(payload: IngestRequestPayload): Promise<IngestResult[]> {
	const supabaseAdmin = getSupabaseAdmin();
	if (!OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not configured.');
	}

	const embeddings = new OpenAIEmbeddings(
		{
			model: DEFAULT_EMBEDDING_MODEL,
			apiKey: OPENROUTER_API_KEY
		},
		{
			baseURL: DEFAULT_BASE_URL,
			defaultHeaders: buildOpenRouterHeaders()
		}
	);
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 200
	});

	const results: IngestResult[] = [];

	for (const file of payload.files) {
		const baseResult: IngestResult = { storagePath: file.storagePath, status: 'failed' };
		try {
			const { data: docRow, error: docError } = await supabaseAdmin
				.from('documents')
				.insert({
					proposal_id: payload.proposalId,
					round: payload.round,
					user_id: payload.userId,
					filename: file.filename,
					storage_path: file.storagePath,
					mime_type: file.mimeType ?? null,
					size_bytes: file.sizeBytes ?? null,
					metadata: { status: 'pending' }
				})
				.select()
				.single();

			if (docError || !docRow) {
				throw new Error(docError?.message ?? 'Failed to create document record.');
			}

			const { data: fileData, error: downloadError } = await supabaseAdmin.storage
				.from(DOCUMENTS_BUCKET)
				.download(file.storagePath);

			if (downloadError || !fileData) {
				throw new Error(downloadError?.message ?? 'Failed to download document.');
			}

			const buffer = Buffer.from(await fileData.arrayBuffer());
			const extension = extname(file.filename).toLowerCase();
			const rawDocs = await loadDocumentsFromBuffer(buffer, file.filename, extension);
			const chunkDocs = await splitter.splitDocuments(rawDocs);

			const enrichedChunks = chunkDocs.map((doc, index) => {
				return new Document({
					pageContent: doc.pageContent,
					metadata: {
						...doc.metadata,
						proposal_id: payload.proposalId,
						round: payload.round,
						document_id: docRow.id,
						filename: file.filename,
						storage_path: file.storagePath,
						chunk_index: index
					}
				});
			});

			const embeddingsResult = await embeddings.embedDocuments(
				enrichedChunks.map((doc) => doc.pageContent)
			);

			const rows = enrichedChunks.map((doc, index) => ({
				document_id: docRow.id,
				proposal_id: payload.proposalId,
				round: payload.round,
				chunk_index: index,
				content: doc.pageContent,
				embedding: embeddingsResult[index],
				metadata: doc.metadata
			}));

			const { error: chunkError } = await supabaseAdmin.from('document_chunks').insert(rows);
			if (chunkError) {
				throw new Error(chunkError.message);
			}

			await supabaseAdmin
				.from('documents')
				.update({ metadata: { status: 'indexed', chunk_count: rows.length } })
				.eq('id', docRow.id);

			results.push({
				storagePath: file.storagePath,
				documentId: docRow.id,
				status: 'indexed',
				chunkCount: rows.length
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			results.push({ ...baseResult, error: errorMessage });
		}
	}

	return results;
}
