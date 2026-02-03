import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const code = params.code;

	// Lobby is deprecated for ZD-191; go straight to the assembly page.
	throw redirect(302, `/${code}/assembly`);
};
