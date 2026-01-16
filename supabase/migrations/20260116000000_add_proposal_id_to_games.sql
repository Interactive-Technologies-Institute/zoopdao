-- Add proposal_id column to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS proposal_id BIGINT REFERENCES public.proposals(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_games_proposal_id ON public.games(proposal_id);

-- Update create_game function to accept proposal_id parameter
CREATE OR REPLACE FUNCTION public.create_game(p_proposal_id BIGINT DEFAULT NULL) 
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
    
    -- Create the game with proposal_id if provided
    INSERT INTO public.games (code, state, proposal_id)
    VALUES (generated_code, 'waiting', p_proposal_id)
    RETURNING id, code INTO result.game_id, result.game_code;
    
    -- Add the owner as the first player
    INSERT INTO public.players (is_owner, user_id, game_id)
    VALUES (TRUE, auth.uid(), result.game_id);
    
    RETURN result;
END;
$$;

