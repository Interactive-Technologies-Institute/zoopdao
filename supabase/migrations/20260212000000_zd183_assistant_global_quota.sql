-- ZD-183: Global assistant quota across rounds 1..6 (max 3 total).

CREATE OR REPLACE FUNCTION public.claim_assistant_question_slot_global(
	p_game_id BIGINT,
	p_round INTEGER,
	p_user_id TEXT,
	p_proposal_id BIGINT DEFAULT NULL
)
RETURNS TABLE(allowed BOOLEAN, used_count INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_round INTEGER;
	v_total INTEGER;
BEGIN
	v_round := GREATEST(1, LEAST(6, COALESCE(p_round, 1)));

	-- Lock existing scope rows for atomic claim across rounds 1..6.
	PERFORM 1
	FROM public.assistant_question_usage AS u
	WHERE u.game_id = p_game_id
		AND u.user_id = p_user_id
		AND u.round BETWEEN 1 AND 6
	FOR UPDATE;

	SELECT COALESCE(SUM(u.used_count), 0)
	INTO v_total
	FROM public.assistant_question_usage AS u
	WHERE u.game_id = p_game_id
		AND u.user_id = p_user_id
		AND u.round BETWEEN 1 AND 6;

	IF v_total >= 3 THEN
		allowed := FALSE;
		used_count := v_total;
		remaining := 0;
		RETURN NEXT;
		RETURN;
	END IF;

	INSERT INTO public.assistant_question_usage (game_id, proposal_id, round, user_id, used_count, updated_at)
	VALUES (p_game_id, p_proposal_id, v_round, p_user_id, 1, NOW())
	ON CONFLICT (game_id, round, user_id)
	DO UPDATE
	SET used_count = public.assistant_question_usage.used_count + 1,
		proposal_id = COALESCE(public.assistant_question_usage.proposal_id, EXCLUDED.proposal_id),
		updated_at = NOW();

	SELECT COALESCE(SUM(u.used_count), 0)
	INTO v_total
	FROM public.assistant_question_usage AS u
	WHERE u.game_id = p_game_id
		AND u.user_id = p_user_id
		AND u.round BETWEEN 1 AND 6;

	allowed := TRUE;
	used_count := v_total;
	remaining := GREATEST(3 - v_total, 0);
	RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_assistant_question_slot_global(BIGINT, INTEGER, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_assistant_question_slot_global(BIGINT, INTEGER, TEXT, BIGINT) TO service_role;

