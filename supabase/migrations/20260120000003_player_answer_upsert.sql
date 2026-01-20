-- Allow overwriting answers for the same round.

CREATE OR REPLACE FUNCTION public.player_answer(
	game_code VARCHAR,
	game_round INT,
	answer TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
	v_game_id BIGINT;
	v_player_id BIGINT;
BEGIN
	SELECT id INTO v_game_id
	FROM public.games
	WHERE code = game_code;

	SELECT id INTO v_player_id
	FROM public.players
	WHERE user_id = auth.uid()
		AND game_id = v_game_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'player-not-found';
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM public.game_rounds
		WHERE game_id = v_game_id
			AND round = game_round
	) THEN
		RAISE EXCEPTION 'round-not-found';
	END IF;

	INSERT INTO public.player_answers (game_id, player_id, answer, round)
	VALUES (v_game_id, v_player_id, answer, game_round)
	ON CONFLICT (game_id, player_id, round)
	DO UPDATE SET answer = EXCLUDED.answer;

	PERFORM public.check_round_completion(v_game_id);
END;
$$;
