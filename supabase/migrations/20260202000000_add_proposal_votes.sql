-- Create table for proposal votes with single vote per user per proposal
CREATE TABLE IF NOT EXISTS public.proposal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id BIGINT NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
    context TEXT NOT NULL CHECK (context IN ('preview', 'discussion')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Uniqueness: one vote per user per proposal (context tracked but not distinct)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_votes_unique_user ON public.proposal_votes (proposal_id, user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON public.proposal_votes (proposal_id);

-- Enable Row Level Security
ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read vote tallies
CREATE POLICY "Anyone can read proposal votes"
ON public.proposal_votes
FOR SELECT
USING (true);

-- Authenticated or anonymous users can insert their own vote
CREATE POLICY "Users can insert their own vote"
ON public.proposal_votes
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.uid() = user_id);

-- Prevent updates; deletes not allowed by default (no policy)
