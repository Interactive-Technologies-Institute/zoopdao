-- ===========================================
-- Remove stops/player_moves and dice_roll
-- ===========================================

-- Remove tables from realtime publication if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
          AND c.relname = 'stops'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.stops;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
          AND c.relname = 'player_moves'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.player_moves;
    END IF;
END;
$$;

-- Drop legacy functions that depend on stops/player_moves
DROP FUNCTION IF EXISTS public.player_move(VARCHAR, INT, INT);
DROP FUNCTION IF EXISTS public.player_start(VARCHAR, INT);
DROP FUNCTION IF EXISTS public.check_starting_round_completion(BIGINT);

-- Drop legacy tables
DROP TABLE IF EXISTS public.player_moves;
DROP TABLE IF EXISTS public.stops;

-- Remove dice_roll column from game_rounds
ALTER TABLE public.game_rounds DROP COLUMN IF EXISTS dice_roll;

-- Recreate roll_dice to only create the next round
CREATE OR REPLACE FUNCTION public.roll_dice(p_game_id BIGINT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    next_round INT;
BEGIN
    SELECT COALESCE(MAX(round), 0) + 1 INTO next_round
    FROM public.game_rounds
    WHERE game_id = p_game_id;

    INSERT INTO public.game_rounds (game_id, round)
    VALUES (p_game_id, next_round);

    RETURN next_round;
END;
$$;

