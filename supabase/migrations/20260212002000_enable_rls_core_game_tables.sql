-- Enable RLS on core public game tables flagged by Supabase security advisor.
-- Baseline policies keep current app behavior:
-- - public read access where the app already reads broadly
-- - write access requires an authenticated session
-- - players writes are limited to the user's own row

-- 1) Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- 2) Read-only content tables
DROP POLICY IF EXISTS cards_read_all ON public.cards;
CREATE POLICY cards_read_all ON public.cards FOR SELECT USING (true);

DROP POLICY IF EXISTS prompt_text_read_all ON public.prompt_text;
CREATE POLICY prompt_text_read_all ON public.prompt_text FOR SELECT USING (true);

DROP POLICY IF EXISTS rounds_read_all ON public.rounds;
CREATE POLICY rounds_read_all ON public.rounds FOR SELECT USING (true);

-- 3) Game runtime tables (public reads, authenticated writes)
DROP POLICY IF EXISTS games_read_all ON public.games;
CREATE POLICY games_read_all ON public.games FOR SELECT USING (true);

DROP POLICY IF EXISTS games_write_authenticated ON public.games;
CREATE POLICY games_write_authenticated
ON public.games
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS game_rounds_read_all ON public.game_rounds;
CREATE POLICY game_rounds_read_all ON public.game_rounds FOR SELECT USING (true);

DROP POLICY IF EXISTS game_rounds_write_authenticated ON public.game_rounds;
CREATE POLICY game_rounds_write_authenticated
ON public.game_rounds
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_cards_read_all ON public.player_cards;
CREATE POLICY player_cards_read_all ON public.player_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS player_cards_write_authenticated ON public.player_cards;
CREATE POLICY player_cards_write_authenticated
ON public.player_cards
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_answers_read_all ON public.player_answers;
CREATE POLICY player_answers_read_all ON public.player_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS player_answers_write_authenticated ON public.player_answers;
CREATE POLICY player_answers_write_authenticated
ON public.player_answers
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4) Players table (public reads, own-row writes)
DROP POLICY IF EXISTS players_read_all ON public.players;
CREATE POLICY players_read_all ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS players_insert_own ON public.players;
CREATE POLICY players_insert_own
ON public.players
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS players_update_own ON public.players;
CREATE POLICY players_update_own
ON public.players
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS players_delete_own ON public.players;
CREATE POLICY players_delete_own
ON public.players
FOR DELETE
USING (user_id = auth.uid());

