-- ZD-184: Pedagogic mode (Round 7) prompt quota configuration per game.
-- Round 7 ends when the user uses all configured prompts (default 5, max 10 in UI).

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS pedagogic_round7_user_prompts INT NOT NULL DEFAULT 5;

