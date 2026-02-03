import { supabase } from '@/supabase';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const code = params.code;

	async function getGame() {
		const { data: gameData, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('code', code)
			.single();
		if (gameError) {
			return error(500, { message: 'Error fetching discussion' });
		}
		return gameData;
	}

	const game = await getGame();

	// Lobby is deprecated; the main experience lives at /[code]/assembly.
	return redirect(302, `/${code}/assembly`);
};
