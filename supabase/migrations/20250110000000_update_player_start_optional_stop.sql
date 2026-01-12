-- ===========================================
-- Create player_start_discussion function (without stop_id)
-- ===========================================
-- This function is for discussion rounds (1-7) that don't require movement
-- The original player_start function remains for round 0 (with stop_id)

-- New function for discussion rounds without stop_id
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
    -- Fetch game ID
    SELECT id INTO v_game_id
    FROM public.games
    WHERE code = game_code;
    
    -- Ensure the player exists
    SELECT id INTO v_player_id
    FROM public.players
    WHERE user_id = auth.uid()
        AND game_id = v_game_id;
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'player-not-found';
    END IF;
    
    -- Get current round
    SELECT COALESCE(MAX(round), 0) INTO v_current_round
    FROM public.game_rounds
    WHERE game_id = v_game_id;
    
    -- For discussion rounds (1-7), we don't need to insert a move
    -- The player is just starting to write their answer
    -- This function marks that the player has started the discussion round
END;
$$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_start_discussion(VARCHAR) TO service_role;

-- ===========================================
-- Create player_next_discussion function (without stop_id)
-- ===========================================
-- This function is for discussion rounds (1-7) that don't require movement
-- It draws a card and assigns it to the player for the current round

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
    -- Fetch game ID
    SELECT id INTO v_game_id
    FROM public.games
    WHERE code = game_code;

    -- Ensure the player exists
    SELECT id INTO v_player_id
    FROM public.players
    WHERE user_id = auth.uid()
        AND game_id = v_game_id;
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'player-not-found';
    END IF;

    -- Ensure the round exists
    IF NOT EXISTS (
        SELECT 1
        FROM public.game_rounds
        WHERE game_id = v_game_id
            AND round = game_round
    ) THEN 
        RAISE EXCEPTION 'round-not-found';
    END IF;

    -- Draw a card that hasn't been used in this game
    -- Try to get an unused card first, matching hero_step and character_category
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
        -- Fallback to any card matching hero_step and character_category if all were used
        SELECT c.id INTO drawn_card_id
        FROM public.cards c
        WHERE p_hero_step = ANY(c.hero_steps)
            AND p_character_category = ANY(c.character_category)
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;

    IF drawn_card_id IS NULL THEN
        -- Final fallback: any card matching character_category
        SELECT c.id INTO drawn_card_id
        FROM public.cards c
        WHERE p_character_category = ANY(c.character_category)
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;

    IF drawn_card_id IS NULL THEN
        RAISE EXCEPTION 'no-cards-found-for-type';
    END IF;

    -- Insert the drawn card (no player_move needed for discussion rounds)
    INSERT INTO public.player_cards (game_id, player_id, card_id, round)
    VALUES (v_game_id, v_player_id, drawn_card_id, game_round);

    RETURN drawn_card_id;
END;
$$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_next_discussion(VARCHAR, INT, SMALLINT, TEXT) TO service_role;

