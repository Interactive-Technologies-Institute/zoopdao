-- ZD-182: Add assistant per-round usage tracking and rolling summaries for bounded AI context.

-- 1) Assistant usage tracking (server-side enforcement).
CREATE TABLE IF NOT EXISTS public.assistant_question_usage (
	id BIGSERIAL PRIMARY KEY,
	game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
	proposal_id BIGINT REFERENCES public.proposals(id) ON DELETE SET NULL,
	round INTEGER NOT NULL CHECK (round >= 0 AND round <= 7),
	user_id TEXT NOT NULL,
	used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assistant_question_usage_game_round_user
	ON public.assistant_question_usage (game_id, round, user_id);

CREATE INDEX IF NOT EXISTS idx_assistant_question_usage_proposal_id
	ON public.assistant_question_usage (proposal_id);

ALTER TABLE public.assistant_question_usage ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_question_usage TO service_role;

-- Atomic quota claim: increments up to 3, otherwise denies.
CREATE OR REPLACE FUNCTION public.claim_assistant_question_slot(
	p_game_id BIGINT,
	p_round INTEGER,
	p_user_id TEXT,
	p_proposal_id BIGINT DEFAULT NULL
)
RETURNS TABLE(allowed BOOLEAN, used_count INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_used INTEGER;
BEGIN
	-- Ensure row exists.
	INSERT INTO public.assistant_question_usage (game_id, proposal_id, round, user_id, used_count)
	VALUES (p_game_id, p_proposal_id, p_round, p_user_id, 0)
	ON CONFLICT (game_id, round, user_id) DO NOTHING;

	-- Lock row for atomic update.
	SELECT u.used_count INTO v_used
	FROM public.assistant_question_usage AS u
	WHERE u.game_id = p_game_id
		AND u.round = p_round
		AND u.user_id = p_user_id
	FOR UPDATE;

	IF v_used >= 3 THEN
		allowed := FALSE;
		used_count := v_used;
		remaining := 0;
		RETURN NEXT;
		RETURN;
	END IF;

	UPDATE public.assistant_question_usage AS u
	SET used_count = u.used_count + 1,
		proposal_id = COALESCE(u.proposal_id, p_proposal_id),
		updated_at = NOW()
	WHERE u.game_id = p_game_id
		AND u.round = p_round
		AND u.user_id = p_user_id
	RETURNING u.used_count INTO v_used;

	allowed := TRUE;
	used_count := v_used;
	remaining := GREATEST(3 - v_used, 0);
	RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_assistant_question_slot(BIGINT, INTEGER, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_assistant_question_slot(BIGINT, INTEGER, TEXT, BIGINT) TO service_role;

-- 2) Rolling summaries for bounded Round 7 context.
CREATE TABLE IF NOT EXISTS public.discussion_round_summaries (
	id BIGSERIAL PRIMARY KEY,
	game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
	round INTEGER NOT NULL CHECK (round >= 0 AND round <= 7),
	summary TEXT NOT NULL DEFAULT '',
	last_message_id BIGINT,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discussion_round_summaries_game_round
	ON public.discussion_round_summaries (game_id, round);

ALTER TABLE public.discussion_round_summaries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussion_round_summaries TO service_role;

-- 3) (Optional but recommended) AI request audit metadata (no raw prompts).
CREATE TABLE IF NOT EXISTS public.ai_request_audit (
	id BIGSERIAL PRIMARY KEY,
	request_id UUID NOT NULL,
	endpoint TEXT NOT NULL,
	game_id BIGINT,
	proposal_id BIGINT,
	round INTEGER,
	provider TEXT,
	model TEXT,
	success BOOLEAN NOT NULL DEFAULT FALSE,
	error_code TEXT,
	latency_ms INTEGER,
	prompt_sizes JSONB,
	rag_chunks INTEGER,
	summary_used BOOLEAN,
	validation_failures JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_request_audit_request_id ON public.ai_request_audit (request_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_audit_created_at ON public.ai_request_audit (created_at);

ALTER TABLE public.ai_request_audit ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_request_audit TO service_role;

-- 4) Trust hardening: prevent client spoofing AI agent messages.
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to insert AI agent messages"
	ON public.discussion_messages;
