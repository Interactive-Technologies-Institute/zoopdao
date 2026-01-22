-- ZD-181f: Harden access control for RAG documents and storage.

-- Documents policies
DROP POLICY IF EXISTS "Anyone can read documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Players can read documents"
	ON public.documents
	FOR SELECT
	TO authenticated
	USING (
		EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = documents.proposal_id
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);

CREATE POLICY "Players can insert documents"
	ON public.documents
	FOR INSERT
	TO authenticated
	WITH CHECK (
		user_id = auth.uid()
		AND EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = documents.proposal_id
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);

CREATE POLICY "Players can update their documents"
	ON public.documents
	FOR UPDATE
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can delete their documents"
	ON public.documents
	FOR DELETE
	TO authenticated
	USING (user_id = auth.uid());

-- Document chunks policies
DROP POLICY IF EXISTS "Anyone can read document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Anyone can insert document chunks" ON public.document_chunks;

CREATE POLICY "Players can read document chunks"
	ON public.document_chunks
	FOR SELECT
	TO authenticated
	USING (
		EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = document_chunks.proposal_id
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);

-- Storage bucket policies for discussion documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('discussion-documents', 'discussion-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Players can read discussion documents" ON storage.objects;
DROP POLICY IF EXISTS "Players can upload discussion documents" ON storage.objects;
DROP POLICY IF EXISTS "Players can delete discussion documents" ON storage.objects;

CREATE POLICY "Players can read discussion documents"
	ON storage.objects
	FOR SELECT
	TO authenticated
	USING (
		bucket_id = 'discussion-documents'
		AND EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = NULLIF(
				regexp_replace(split_part(name, '/', 1), '[^0-9]', '', 'g'),
				''
			)::bigint
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);

CREATE POLICY "Players can upload discussion documents"
	ON storage.objects
	FOR INSERT
	TO authenticated
	WITH CHECK (
		bucket_id = 'discussion-documents'
		AND EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = NULLIF(
				regexp_replace(split_part(name, '/', 1), '[^0-9]', '', 'g'),
				''
			)::bigint
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);

CREATE POLICY "Players can delete discussion documents"
	ON storage.objects
	FOR DELETE
	TO authenticated
	USING (
		bucket_id = 'discussion-documents'
		AND EXISTS (
			SELECT 1
			FROM public.games g
			JOIN public.players p ON p.game_id = g.id
			WHERE g.proposal_id = NULLIF(
				regexp_replace(split_part(name, '/', 1), '[^0-9]', '', 'g'),
				''
			)::bigint
				AND p.user_id = auth.uid()
				AND COALESCE(p.is_active, true) = true
		)
	);
