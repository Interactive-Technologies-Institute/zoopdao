-- ZD-181g: Allow multiple AI messages per round by adding turn_index.

ALTER TABLE public.discussion_messages
	ADD COLUMN IF NOT EXISTS turn_index INT;

DROP INDEX IF EXISTS idx_discussion_messages_ai_agent_unique_per_round;

CREATE UNIQUE INDEX IF NOT EXISTS idx_discussion_messages_ai_agent_turn_unique
	ON public.discussion_messages (game_id, round, agent_role, turn_index)
	WHERE participant_type = 'ai_agent'
		AND agent_role IS NOT NULL
		AND turn_index IS NOT NULL;
