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

-- Step 4: Migrate existing data (map old characters to new roles)
-- Since we're changing the system completely, set a default role for existing players
-- All existing players will get 'administration' as default role
UPDATE public.players SET role = 'administration' WHERE role IS NULL;

-- Step 5: Make role NOT NULL after migration (only if it's currently nullable)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'players' 
        AND column_name = 'role'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.players ALTER COLUMN role SET NOT NULL;
    END IF;
END $$;

-- Step 6: Add new UNIQUE constraint on (role, game_id) to maintain the same logic
-- This ensures only one player can have each role per game (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'players_role_game_id_key'
    ) THEN
        ALTER TABLE public.players ADD CONSTRAINT players_role_game_id_key UNIQUE (role, game_id);
    END IF;
END $$;

-- Step 7: Drop old character column (optional - keeping it commented for backward compatibility)
-- Uncomment the line below when ready to fully remove the character column
-- ALTER TABLE public.players DROP COLUMN IF EXISTS character;

-- Note: The old character_type enum and character column can be removed in a future migration
-- after ensuring all data is migrated and the application is fully updated to use roles

