-- Update check_all_players_ready function to check role instead of character
-- This ensures the game state becomes 'ready' when all players have selected their role

CREATE OR REPLACE FUNCTION public.check_all_players_ready(p_game_id BIGINT) 
RETURNS VOID 
LANGUAGE plpgsql 
AS $$ 
BEGIN 
    -- Check if any player is missing role (or character for legacy), nickname, or description
    -- Priority: Check role first (new system), fallback to character (legacy system)
    IF EXISTS (
        SELECT 1
        FROM public.players
        WHERE game_id = p_game_id
            AND (
                role IS NULL  -- New system: role must be selected
                OR nickname IS NULL
                OR description IS NULL
            )
    ) THEN
        -- Not all players are ready
        UPDATE public.games
        SET state = 'waiting'
        WHERE id = p_game_id;
    ELSE
        -- All players are ready
        UPDATE public.games
        SET state = 'ready'
        WHERE id = p_game_id;
    END IF;
END;
$$;

