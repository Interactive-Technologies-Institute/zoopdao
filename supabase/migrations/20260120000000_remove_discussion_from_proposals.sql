-- ZD-172: Remove proposal discussion field
-- Discussion should live only in discussion/history messages, not as a proposals attribute.

ALTER TABLE public.proposals
	DROP CONSTRAINT IF EXISTS proposals_discussion_check;

ALTER TABLE public.proposals
	DROP COLUMN IF EXISTS discussion;
