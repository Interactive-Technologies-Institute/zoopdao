import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
	const url = PUBLIC_SUPABASE_URL;
	if (!url) {
		throw new Error('PUBLIC_SUPABASE_URL is not configured.');
	}
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
	}

	return createClient(url, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}
