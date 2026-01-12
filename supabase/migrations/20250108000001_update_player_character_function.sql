-- Update update_player_character function to also set role
-- This function is called when a player selects their character/role in the lobby
-- Since we're transitioning to roles, we need to handle both character and role

-- First, create a new function that accepts role_type directly
CREATE OR REPLACE FUNCTION public.update_player_role(
    game_code VARCHAR,
    player_role role_type
) RETURNS VOID 
LANGUAGE plpgsql 
AS $$
DECLARE 
    v_game_id BIGINT;
BEGIN
    -- Get game ID
    SELECT id INTO v_game_id
    FROM public.games
    WHERE code = game_code;
    
    -- Check if role is already taken
    IF EXISTS (
        SELECT 1
        FROM public.players
        WHERE game_id = v_game_id
            AND role = player_role
            AND role IS NOT NULL
    ) THEN 
        RAISE EXCEPTION 'role-already-taken';
    END IF;
    
    -- Update role (and character for backward compatibility - try to cast)
    UPDATE public.players
    SET role = player_role
    WHERE user_id = auth.uid()
        AND game_id = v_game_id;
    
    -- Check if all players are ready
    PERFORM public.check_all_players_ready(v_game_id);
END;
$$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.update_player_role(VARCHAR, role_type) TO anon;
GRANT EXECUTE ON FUNCTION public.update_player_role(VARCHAR, role_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_role(VARCHAR, role_type) TO service_role;

-- Keep the old function for backward compatibility, but make it handle role mapping
CREATE OR REPLACE FUNCTION public.update_player_character(
    game_code VARCHAR,
    player_character character_type
) RETURNS VOID 
LANGUAGE plpgsql 
AS $$
DECLARE 
    v_game_id BIGINT;
    v_role role_type;
BEGIN
    -- Get game ID
    SELECT id INTO v_game_id
    FROM public.games
    WHERE code = game_code;
    
    -- Try to cast character to role (for roles that match enum values)
    -- If the character value matches a role enum value, use it directly
    -- Otherwise, default to 'administration'
    BEGIN
        v_role := player_character::text::role_type;
    EXCEPTION
        WHEN OTHERS THEN
            -- If casting fails, default to administration
            v_role := 'administration'::role_type;
    END;
    
    -- Check if role is already taken (for non-NULL roles)
    IF v_role IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.players
        WHERE game_id = v_game_id
            AND role = v_role
            AND role IS NOT NULL
    ) THEN 
        RAISE EXCEPTION 'character-already-taken';
    END IF;
    
    -- Also check character constraint for backward compatibility
    IF EXISTS (
        SELECT 1
        FROM public.players
        WHERE game_id = v_game_id
            AND character = player_character
            AND character IS NOT NULL
    ) THEN 
        RAISE EXCEPTION 'character-already-taken';
    END IF;
    
    -- Update both character and role
    UPDATE public.players
    SET character = player_character,
        role = v_role
    WHERE user_id = auth.uid()
        AND game_id = v_game_id;
    
    -- Check if all players are ready
    PERFORM public.check_all_players_ready(v_game_id);
END;
$$;

