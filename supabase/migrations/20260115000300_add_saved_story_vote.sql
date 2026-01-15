-- Add vote column to saved_stories
ALTER TABLE public.saved_stories
ADD COLUMN IF NOT EXISTS vote TEXT;

DO $$ BEGIN
	ALTER TABLE public.saved_stories
		ADD CONSTRAINT saved_stories_vote_check
		CHECK (vote IN ('yes', 'no', 'abstain'));
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Update save_story functions to accept vote
CREATE OR REPLACE FUNCTION public.save_story(
	p_player_name TEXT,
	p_story_title TEXT,
	p_character JSONB,
	p_rounds JSONB,
	p_card_types TEXT[],
	p_full_story TEXT,
	p_vote TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
	v_story_id TEXT;
BEGIN
	-- Validate character structure
	IF (p_character->>'type')::character_type IS NULL THEN
		RAISE EXCEPTION 'Invalid character type';
	END IF;

	IF p_character->>'nickname' IS NULL THEN
		RAISE EXCEPTION 'Character nickname is required';
	END IF;

	-- Generate story ID
	SELECT generate_story_id() INTO v_story_id;

	-- Insert the story
	INSERT INTO public.saved_stories (
		story_id,
		player_name,
		story_title,
		character,
		rounds,
		card_types,
		full_story,
		vote
	)
	VALUES (
		v_story_id,
		p_player_name,
		p_story_title,
		p_character,
		p_rounds,
		p_card_types,
		p_full_story,
		p_vote
	);

	RETURN v_story_id;
EXCEPTION
	WHEN others THEN
		RAISE EXCEPTION 'Error saving story: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_story(
	p_player_name TEXT,
	p_story_title TEXT,
	p_character JSONB,
	p_rounds JSONB,
	p_vote TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
	v_story_id TEXT;
	v_card_types TEXT[];
	v_full_story TEXT;
BEGIN
	-- Validate character structure
	IF (p_character->>'type')::character_type IS NULL THEN
		RAISE EXCEPTION 'Invalid character type';
	END IF;

	IF p_character->>'nickname' IS NULL THEN
		RAISE EXCEPTION 'Character nickname is required';
	END IF;

	-- Generate story ID
	v_story_id := generate_story_id();

	-- Extract unique card types
	SELECT ARRAY(
		SELECT DISTINCT value->>'type'
		FROM jsonb_array_elements(p_rounds) AS r(value)
		WHERE value->>'type' IS NOT NULL
	) INTO v_card_types;

	-- Combine all answers into one story
	SELECT string_agg(value->>'answer', E'\n\n')
	FROM (
		SELECT value
		FROM jsonb_each(p_rounds) AS r(key, value)
		ORDER BY (key::integer)
	) AS sorted_rounds
	INTO v_full_story;

	-- Insert the story
	INSERT INTO public.saved_stories (
		story_id,
		player_name,
		story_title,
		character,
		rounds,
		card_types,
		full_story,
		vote
	)
	VALUES (
		v_story_id,
		p_player_name,
		p_story_title,
		p_character,
		p_rounds,
		v_card_types,
		v_full_story,
		p_vote
	);

	RETURN v_story_id;
EXCEPTION
	WHEN others THEN
		RAISE EXCEPTION 'Error saving story: %', SQLERRM;
END;
$$;

