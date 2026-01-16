-- Add mode column to games table
-- Mode can be 'pedagogic' (with timer) or 'decision_making' (without timer)
DO $$ BEGIN
    CREATE TYPE game_mode AS ENUM ('pedagogic', 'decision_making');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS mode game_mode DEFAULT 'pedagogic';

-- Update create_game function to accept mode parameter
CREATE OR REPLACE FUNCTION public.create_game(
    p_proposal_id BIGINT DEFAULT NULL,
    p_mode game_mode DEFAULT 'pedagogic'
) 
RETURNS public.create_game_result 
LANGUAGE plpgsql 
AS $$
DECLARE 
    generated_code VARCHAR;
    result public.create_game_result;
BEGIN 
    -- Generate a random unique game code
    LOOP 
        generated_code := LEFT(MD5(RANDOM()::TEXT), 6);
        IF NOT EXISTS (
            SELECT 1
            FROM public.games
            WHERE code = generated_code
        ) THEN 
            EXIT;
        END IF;
    END LOOP;
    
    -- Create the game with proposal_id and mode if provided
    INSERT INTO public.games (code, state, proposal_id, mode)
    VALUES (generated_code, 'waiting', p_proposal_id, p_mode)
    RETURNING id, code INTO result.game_id, result.game_code;
    
    -- Add the owner as the first player
    INSERT INTO public.players (is_owner, user_id, game_id)
    VALUES (TRUE, auth.uid(), result.game_id);
    
    RETURN result;
END;
$$;

