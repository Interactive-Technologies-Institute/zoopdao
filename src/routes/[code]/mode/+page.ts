import { supabase } from '@/supabase';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { userId } = await parent();
	const code = params.code;

	// Get game
	const { data: gameData, error: gameError } = await supabase
		.from('games')
		.select('*')
		.eq('code', code)
		.single();

	if (gameError) {
		return error(404, { message: 'Game not found' });
	}

	// Check if user is owner
	const { data: playersData } = await supabase
		.from('players')
		.select('*')
		.eq('game_id', gameData.id)
		.eq('user_id', userId);

	const isOwner = playersData?.some(p => p.is_owner && p.user_id === userId);

	if (!isOwner) {
		// Non-owners skip mode selection and go directly to lobby
		return redirect(302, `/${code}/lobby`);
	}

	return {
		game: gameData
	};
};
