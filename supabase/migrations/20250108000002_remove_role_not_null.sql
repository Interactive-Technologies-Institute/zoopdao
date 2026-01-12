-- Remove NOT NULL constraint from role column
-- This allows players to be created without a role (they select it in the lobby)

-- Step 1: Remove NOT NULL constraint if it exists
DO $$ 
BEGIN
    -- Check if the column has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'players' 
        AND column_name = 'role'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.players ALTER COLUMN role DROP NOT NULL;
    END IF;
END $$;

