-- Pedagogic mode timer configuration per game (minutes).
-- Rounds 1-6 share one duration; round 7 (final) has its own.
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS pedagogic_rounds_timer_minutes INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS pedagogic_final_timer_minutes INT NOT NULL DEFAULT 2;

