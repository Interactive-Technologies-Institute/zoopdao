-- Update character_type enum to roles for ZoopDAO
-- This migration replaces character types with organizational roles

-- Step 1: Create new role_type enum (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE public.role_type AS ENUM (
            'administration',
            'research',
            'reception',
            'operations',
            'bar',
            'cleaning'
        );
    END IF;
END $$;

-- Step 2: Drop the existing UNIQUE constraint on (character, game_id)
-- This constraint prevents multiple players from having the same character in a game
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_character_game_id_key;

-- Step 3: Add new column with role_type (nullable initially, only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'players' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.players ADD COLUMN role role_type;
    END IF;
END $$;

-- Step 4: Migrate existing data (only for players that already have a character)
-- Only migrate players that existed before this migration
-- New players will have NULL role until they select one in the lobby
-- Note: This migration only runs once, so existing players with characters get a default role
DO $$ 
BEGIN
    -- Only update players that have a character but no role (existing data migration)
    -- Skip this if there are no such players (fresh database)
    UPDATE public.players 
    SET role = 'administration'::role_type 
    WHERE role IS NULL 
    AND character IS NOT NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'role');
END $$;

-- Step 5: Keep role nullable initially (players select role in lobby)
-- Role will be set when player selects their role in the lobby
-- We don't set NOT NULL constraint here - role can be NULL until selected

-- Step 6: Add new UNIQUE constraint on (role, game_id) to maintain the same logic
-- This ensures only one player can have each role per game
-- Note: NULL values are allowed (multiple players can have NULL role until they select)
-- We use a partial unique index to allow multiple NULLs but enforce uniqueness for non-NULL values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'players_role_game_id_unique_idx'
    ) THEN
        CREATE UNIQUE INDEX players_role_game_id_unique_idx 
        ON public.players (role, game_id) 
        WHERE role IS NOT NULL;
    END IF;
END $$;

-- Step 7: Drop old character column (optional - keeping it commented for backward compatibility)
-- Uncomment the line below when ready to fully remove the character column
-- ALTER TABLE public.players DROP COLUMN IF EXISTS character;

-- Note: The old character_type enum and character column can be removed in a future migration
-- after ensuring all data is migrated and the application is fully updated to use roles

