-- Restore discussion RPCs after removing stops/player_moves.

CREATE OR REPLACE FUNCTION public.player_start_discussion(
	game_code VARCHAR
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
	v_game_id BIGINT;
	v_player_id BIGINT;
	v_current_round INT;
BEGIN
	SELECT id INTO v_game_id
	FROM public.games
	WHERE code = game_code;

	SELECT id INTO v_player_id
	FROM public.players
	WHERE user_id = auth.uid()
		AND game_id = v_game_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'player-not-found';
	END IF;

	SELECT COALESCE(MAX(round), 0) INTO v_current_round
	FROM public.game_rounds
	WHERE game_id = v_game_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO service_role;

CREATE OR REPLACE FUNCTION public.player_next_discussion(
	game_code VARCHAR,
	game_round INT,
	p_hero_step SMALLINT,
	p_character_category TEXT
) RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
	v_game_id BIGINT;
	v_player_id BIGINT;
	drawn_card_id INT;
BEGIN
	SELECT id INTO v_game_id
	FROM public.games
	WHERE code = game_code;

	SELECT id INTO v_player_id
	FROM public.players
	WHERE user_id = auth.uid()
		AND game_id = v_game_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'player-not-found';
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM public.game_rounds
		WHERE game_id = v_game_id
			AND round = game_round
	) THEN
		RAISE EXCEPTION 'round-not-found';
	END IF;

	SELECT c.id INTO drawn_card_id
	FROM public.cards c
	WHERE p_hero_step = ANY(c.hero_steps)
		AND p_character_category = ANY(c.character_category)
		AND NOT EXISTS (
			SELECT 1
			FROM public.player_cards pc
			WHERE pc.game_id = v_game_id
				AND pc.card_id = c.id
		)
	ORDER BY RANDOM()
	LIMIT 1;

	IF drawn_card_id IS NULL THEN
		SELECT c.id INTO drawn_card_id
		FROM public.cards c
		WHERE p_hero_step = ANY(c.hero_steps)
			AND p_character_category = ANY(c.character_category)
		ORDER BY RANDOM()
		LIMIT 1;
	END IF;

	IF drawn_card_id IS NULL THEN
		SELECT c.id INTO drawn_card_id
		FROM public.cards c
		WHERE p_character_category = ANY(c.character_category)
		ORDER BY RANDOM()
		LIMIT 1;
	END IF;

	IF drawn_card_id IS NULL THEN
		RAISE EXCEPTION 'no-cards-found-for-type';
	END IF;

	INSERT INTO public.player_cards (game_id, player_id, card_id, round)
	VALUES (v_game_id, v_player_id, drawn_card_id, game_round);

	RETURN drawn_card_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO service_role;
