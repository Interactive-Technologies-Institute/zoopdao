-- Relax character validation for saved discussions and update functions
ALTER TABLE public.saved_discussions
DROP CONSTRAINT IF EXISTS valid_discussion_character_type;

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
    IF p_character->>'nickname' IS NULL THEN
        RAISE EXCEPTION 'Character nickname is required';
    END IF;

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
    IF p_character->>'nickname' IS NULL THEN
        RAISE EXCEPTION 'Character nickname is required';
    END IF;

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

