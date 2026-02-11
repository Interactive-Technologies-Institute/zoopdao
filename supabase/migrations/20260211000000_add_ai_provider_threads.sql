-- ZD-183: Persist provider conversation thread ids per user/game/round.
CREATE TABLE IF NOT EXISTS public.ai_provider_threads (
	id BIGSERIAL PRIMARY KEY,
	game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
	round INTEGER NOT NULL CHECK (round >= 0 AND round <= 7),
	user_id TEXT NOT NULL,
	provider TEXT NOT NULL,
	thread_id TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_provider_threads_scope
	ON public.ai_provider_threads (game_id, round, user_id, provider);

CREATE INDEX IF NOT EXISTS idx_ai_provider_threads_thread_id
	ON public.ai_provider_threads (thread_id);

ALTER TABLE public.ai_provider_threads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_provider_threads TO service_role;
