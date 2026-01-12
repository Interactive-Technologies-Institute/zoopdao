-- Create enum for participant type
DO $$ BEGIN
    CREATE TYPE participant_type AS ENUM ('human', 'ai_agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for agent role (reuse existing role_type if available, otherwise create)
DO $$ BEGIN
    CREATE TYPE agent_role_type AS ENUM ('administration', 'research', 'reception', 'operations', 'bar', 'cleaning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create discussion_messages table
CREATE TABLE IF NOT EXISTS public.discussion_messages (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    proposal_id BIGINT REFERENCES public.proposals(id) ON DELETE SET NULL,
    round INTEGER NOT NULL CHECK (round >= 0 AND round <= 7),
    participant_type participant_type NOT NULL,
    participant_id BIGINT REFERENCES public.players(id) ON DELETE SET NULL,
    agent_role agent_role_type,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT participant_id_required_for_human CHECK (
        (participant_type = 'human' AND participant_id IS NOT NULL) OR
        (participant_type = 'ai_agent')
    ),
    CONSTRAINT agent_role_only_for_ai CHECK (
        (participant_type = 'ai_agent' AND agent_role IS NOT NULL) OR
        (participant_type = 'human' AND agent_role IS NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discussion_messages_game_id ON public.discussion_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_proposal_id ON public.discussion_messages(proposal_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_round ON public.discussion_messages(round);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_at ON public.discussion_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_participant_type ON public.discussion_messages(participant_type);

-- Enable Row Level Security
ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read messages for a game they have access to
CREATE POLICY "Anyone can read discussion messages for accessible games"
    ON public.discussion_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.games
            WHERE games.id = discussion_messages.game_id
        )
    );

-- Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert their own messages"
    ON public.discussion_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        participant_type = 'human' AND
        participant_id IN (
            SELECT id FROM public.players
            WHERE user_id = auth.uid()
        )
    );

-- Anonymous users can insert messages (for anonymous sessions)
CREATE POLICY "Anonymous users can insert messages"
    ON public.discussion_messages
    FOR INSERT
    TO anon
    WITH CHECK (
        participant_type = 'human' AND
        participant_id IS NOT NULL
    );

-- Service role can insert AI agent messages
CREATE POLICY "Service role can insert AI agent messages"
    ON public.discussion_messages
    FOR INSERT
    TO service_role
    WITH CHECK (participant_type = 'ai_agent');

-- Grant permissions
GRANT SELECT ON public.discussion_messages TO anon, authenticated;
GRANT INSERT ON public.discussion_messages TO anon, authenticated, service_role;

