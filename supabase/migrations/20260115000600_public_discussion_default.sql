-- Ensure saved discussions are visible in the browser history list by default
ALTER TABLE public.saved_discussions
ALTER COLUMN public_discussion SET DEFAULT true;

-- Backfill existing rows that were saved as non-public
UPDATE public.saved_discussions
SET public_discussion = true
WHERE public_discussion IS DISTINCT FROM true;

