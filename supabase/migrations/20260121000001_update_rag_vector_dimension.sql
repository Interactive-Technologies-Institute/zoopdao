-- ZD-181b: Align RAG vector dimension with OpenRouter bge-m3 (1024).
-- Assumes no existing embeddings or they can be safely recast.

DROP INDEX IF EXISTS idx_document_chunks_embedding;

ALTER TABLE public.document_chunks
	ALTER COLUMN embedding TYPE extensions.vector(1024)
	USING embedding::extensions.vector(1024);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
	ON public.document_chunks
	USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_documents(
	query_embedding extensions.vector(1024),
	match_count INT DEFAULT NULL,
	filter JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (
	id BIGINT,
	content TEXT,
	metadata JSONB,
	similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
	RETURN QUERY
	SELECT
		document_chunks.id,
		document_chunks.content,
		document_chunks.metadata,
		1 - (document_chunks.embedding <=> query_embedding) AS similarity
	FROM public.document_chunks
	WHERE document_chunks.metadata @> filter
	ORDER BY document_chunks.embedding <=> query_embedding
	LIMIT match_count;
END;
$$;
