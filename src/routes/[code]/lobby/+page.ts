import { supabase } from '@/supabase';
import type { Game, GameId, Player } from '@/types';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, parent }) => {
	const { userId } = await parent();
	const code = params.code;

	async function getGame(): Promise<Game> {
		const { data: gameData, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('code', code)
			.single();

		if (gameError) {
			return error(404, { message: 'Discussion not found' });
		}

		return gameData;
	}

	async function getPlayers(gameId: GameId): Promise<Player[]> {
		const { data: playersData, error: playersError } = await supabase
			.from('players')
			.select('*')
			.eq('game_id', gameId);

		if (playersError) {
			return error(500, { message: 'Error fetching participants' });
		}

		return playersData;
	}

	const game = await getGame();

	if (game.state !== 'waiting' && game.state !== 'ready') {
		return redirect(302, `/${code}/game`);
	}

	const players = await getPlayers(game.id);

	const player = players.find((player) => player.user_id === userId);

	if (!player) {
		return error(403, { message: 'You are not a participant in this discussion' });
	}

	return { game, players, playerId: player.id };
};
