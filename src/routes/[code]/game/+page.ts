import { redirect } from '@sveltejs/kit';

// Backward compatibility: /[code]/game now lives at /[code]/assembly
export const load = async ({ params }) => {
	throw redirect(302, `/${params.code}/assembly`);
};

