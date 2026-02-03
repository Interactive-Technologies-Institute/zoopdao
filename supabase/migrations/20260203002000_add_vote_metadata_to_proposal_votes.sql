-- Persist vote metadata so the proposal preview can show a public "votes table"
-- (cargo/role + discussion mode at the time of voting).

ALTER TABLE public.proposal_votes
ADD COLUMN IF NOT EXISTS cargo TEXT;

ALTER TABLE public.proposal_votes
ADD COLUMN IF NOT EXISTS discussion_mode TEXT;

-- Default to "no_discussion" so older rows and clients still work.
ALTER TABLE public.proposal_votes
ALTER COLUMN discussion_mode SET DEFAULT 'no_discussion';

-- Backfill existing rows (best-effort).
UPDATE public.proposal_votes
SET discussion_mode = CASE
    WHEN context = 'preview' THEN 'no_discussion'
    WHEN context = 'discussion' THEN COALESCE(discussion_mode, 'pedagogic')
    ELSE COALESCE(discussion_mode, 'no_discussion')
END
WHERE discussion_mode IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'proposal_votes_discussion_mode_check'
    ) THEN
        ALTER TABLE public.proposal_votes
        ADD CONSTRAINT proposal_votes_discussion_mode_check
        CHECK (discussion_mode IN ('no_discussion', 'pedagogic', 'decision_making'));
    END IF;
END
$$;

