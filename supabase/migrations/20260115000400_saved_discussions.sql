-- Add proposal_id before renaming table
ALTER TABLE public.saved_stories
ADD COLUMN IF NOT EXISTS proposal_id BIGINT REFERENCES public.proposals(id) ON DELETE SET NULL;

-- Rename table and columns to discussion naming
ALTER TABLE public.saved_stories RENAME TO saved_discussions;

ALTER TABLE public.saved_discussions RENAME COLUMN story_id TO discussion_id;
ALTER TABLE public.saved_discussions RENAME COLUMN story_title TO discussion_title;
ALTER TABLE public.saved_discussions RENAME COLUMN full_story TO full_discussion;
ALTER TABLE public.saved_discussions RENAME COLUMN public_story TO public_discussion;

-- Rename identity sequence if present
ALTER SEQUENCE IF EXISTS public.saved_stories_id_seq RENAME TO saved_discussions_id_seq;

-- Rename constraints and indexes to discussion naming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saved_stories_pkey'
    ) THEN
        EXECUTE 'ALTER TABLE public.saved_discussions RENAME CONSTRAINT saved_stories_pkey TO saved_discussions_pkey';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saved_stories_story_id_key'
    ) THEN
        EXECUTE 'ALTER TABLE public.saved_discussions RENAME CONSTRAINT saved_stories_story_id_key TO saved_discussions_discussion_id_key';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saved_stories_vote_check'
    ) THEN
        EXECUTE 'ALTER TABLE public.saved_discussions RENAME CONSTRAINT saved_stories_vote_check TO saved_discussions_vote_check';
    END IF;
END
$$;

ALTER INDEX IF EXISTS idx_saved_stories_story_id RENAME TO idx_saved_discussions_discussion_id;
ALTER INDEX IF EXISTS idx_character_search RENAME TO idx_saved_discussions_character_search;
ALTER INDEX IF EXISTS story_search_idx RENAME TO discussion_search_idx;

-- RLS policies for saved_discussions
DROP POLICY IF EXISTS "Anyone can read saved stories" ON public.saved_discussions;
DROP POLICY IF EXISTS "Anyone can insert stories" ON public.saved_discussions;

CREATE POLICY "Anyone can read saved discussions"
    ON public.saved_discussions
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert discussions"
    ON public.saved_discussions
    FOR INSERT
    WITH CHECK (true);

-- Save discussion function with full payload
CREATE OR REPLACE FUNCTION public.save_discussion(
    p_player_name TEXT,
    p_discussion_title TEXT,
    p_character JSONB,
    p_rounds JSONB,
    p_card_types TEXT[],
    p_full_discussion TEXT,
    p_vote TEXT DEFAULT NULL,
    p_proposal_id BIGINT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_discussion_id TEXT;
BEGIN
    SELECT generate_story_id() INTO v_discussion_id;

    INSERT INTO public.saved_discussions (
        discussion_id,
        player_name,
        discussion_title,
        character,
        rounds,
        card_types,
        full_discussion,
        vote,
        proposal_id
    )
    VALUES (
        v_discussion_id,
        p_player_name,
        p_discussion_title,
        p_character,
        p_rounds,
        p_card_types,
        p_full_discussion,
        p_vote,
        p_proposal_id
    );

    RETURN v_discussion_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error saving discussion: %', SQLERRM;
END;
$$;

-- Save discussion function with minimal payload
CREATE OR REPLACE FUNCTION public.save_discussion(
    p_player_name TEXT,
    p_discussion_title TEXT,
    p_character JSONB,
    p_rounds JSONB,
    p_vote TEXT DEFAULT NULL,
    p_proposal_id BIGINT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_discussion_id TEXT;
    v_card_types TEXT[];
    v_full_discussion TEXT;
BEGIN
    v_discussion_id := generate_story_id();

    SELECT ARRAY(
        SELECT DISTINCT value->>'type'
        FROM jsonb_array_elements(p_rounds) AS r(value)
        WHERE value->>'type' IS NOT NULL
    ) INTO v_card_types;

    SELECT string_agg(value->>'answer', E'\n\n')
    FROM (
        SELECT value
        FROM jsonb_each(p_rounds) AS r(key, value)
        ORDER BY (key::integer)
    ) AS sorted_rounds
    INTO v_full_discussion;

    INSERT INTO public.saved_discussions (
        discussion_id,
        player_name,
        discussion_title,
        character,
        rounds,
        card_types,
        full_discussion,
        vote,
        proposal_id
    )
    VALUES (
        v_discussion_id,
        p_player_name,
        p_discussion_title,
        p_character,
        p_rounds,
        v_card_types,
        v_full_discussion,
        p_vote,
        p_proposal_id
    );

    RETURN v_discussion_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error saving discussion: %', SQLERRM;
END;
$$;

GRANT ALL ON FUNCTION public.save_discussion(
    p_player_name TEXT,
    p_discussion_title TEXT,
    p_character JSONB,
    p_rounds JSONB,
    p_card_types TEXT[],
    p_full_discussion TEXT,
    p_vote TEXT,
    p_proposal_id BIGINT
) TO anon, authenticated, service_role;

GRANT ALL ON FUNCTION public.save_discussion(
    p_player_name TEXT,
    p_discussion_title TEXT,
    p_character JSONB,
    p_rounds JSONB,
    p_vote TEXT,
    p_proposal_id BIGINT
) TO anon, authenticated, service_role;

