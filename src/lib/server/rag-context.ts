export const RAG_CONTEXT_MAX_CHARS = 1200;
export const RAG_CONTEXT_MAX_CHUNKS = 6;

export type RagChunkLike = {
	content: string;
	similarity: number;
	metadata: Record<string, unknown>;
};

export function buildRagContext(chunks: RagChunkLike[], maxChars: number = RAG_CONTEXT_MAX_CHARS): string {
	let used = 0;
	const lines: string[] = [];

	for (let index = 0; index < chunks.length; index += 1) {
		const chunk = chunks[index];
		const filename = typeof chunk.metadata?.filename === 'string' ? chunk.metadata.filename : 'document';
		const similarity = Number.isFinite(chunk.similarity) ? chunk.similarity.toFixed(3) : 'n/a';
		const header = `[${index + 1}] ${filename} (similarity ${similarity})`;
		const content = (chunk.content ?? '').trim();
		const entry = `${header}\n${content}`;

		if (used + entry.length > maxChars) {
			const remaining = Math.max(maxChars - used - header.length - 1, 0);
			if (remaining <= 0) break;
			lines.push(`${header}\n${content.slice(0, remaining)}`.trim());
			break;
		}

		lines.push(entry);
		used += entry.length + 1;
	}

	return lines.join('\n\n');
}

