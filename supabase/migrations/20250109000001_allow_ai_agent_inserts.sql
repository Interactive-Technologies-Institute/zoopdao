-- Allow anonymous and authenticated users to insert AI agent messages
-- This is needed because the API endpoint uses anonymous sessions to insert AI messages

CREATE POLICY "Allow anonymous and authenticated users to insert AI agent messages"
    ON public.discussion_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        participant_type = 'ai_agent' AND
        agent_role IS NOT NULL AND
        game_id IS NOT NULL
    );

-- Limit to 1 message per AI agent per round
-- Create unique index to enforce one message per agent_role per game_id per round
CREATE UNIQUE INDEX IF NOT EXISTS idx_discussion_messages_ai_agent_unique_per_round
    ON public.discussion_messages (game_id, round, agent_role)
    WHERE participant_type = 'ai_agent' AND agent_role IS NOT NULL;

