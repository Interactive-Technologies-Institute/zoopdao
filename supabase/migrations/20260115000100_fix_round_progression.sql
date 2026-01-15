-- ===========================================
-- Fix round progression for discussion flow
-- ===========================================

-- Allow round 0 answers without requiring a game_round row.
CREATE OR REPLACE FUNCTION public.player_answer(
    game_code VARCHAR,
    game_round INT,
    answer TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_game_id BIGINT;
    v_player_id BIGINT;
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

    -- Ensure the round exists for discussion rounds beyond round 0
    IF game_round > 0 AND NOT EXISTS (
        SELECT 1
        FROM public.game_rounds
        WHERE game_id = v_game_id
            AND round = game_round
    ) THEN
        RAISE EXCEPTION 'round-not-found';
    END IF;

    -- Insert the player's answer
    INSERT INTO public.player_answers (game_id, player_id, answer, round)
    VALUES (v_game_id, v_player_id, answer, game_round);

    -- Check if round is complete
    PERFORM public.check_round_completion(v_game_id);
END;
$$;

-- Update round completion to set playing after round 0 and finish on round 7.
CREATE OR REPLACE FUNCTION public.check_round_completion(p_game_id BIGINT) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    current_round INT;
    player_count INT;
    answer_count INT;
BEGIN
    -- Get the current round number
    SELECT COALESCE(MAX(round), 0) INTO current_round
    FROM public.game_rounds
    WHERE game_id = p_game_id;

    -- Count total players in the game
    SELECT COUNT(*) INTO player_count
    FROM public.players
    WHERE game_id = p_game_id;

    -- Count answers for the current round
    SELECT COUNT(*) INTO answer_count
    FROM public.player_answers pa
        JOIN public.players p ON pa.player_id = p.id
    WHERE p.game_id = p_game_id
        AND pa.round = current_round;

    -- If all players have answered
    IF player_count = answer_count THEN
        -- After round 0, move game to playing
        IF current_round = 0 THEN
            UPDATE public.games
            SET state = 'playing'
            WHERE id = p_game_id;
        END IF;

        -- If this was the final round (7), set game state to finished
        IF current_round >= 7 THEN
            UPDATE public.games
            SET state = 'finished'
            WHERE id = p_game_id;
        -- Otherwise, continue to next round
        ELSE
            PERFORM public.roll_dice(p_game_id);
        END IF;
    END IF;
END;
$$;

