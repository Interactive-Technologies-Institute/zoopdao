import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { reindexDocument } from '$lib/server/rag-ingest';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';

const reindexSchema = z.object({
	documentId: z.number().int().positive(),
	userId: z.string().min(1)
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const payload = reindexSchema.parse(body);

		const supabaseAdmin = getSupabaseAdmin();
		const { data: docRow, error } = await supabaseAdmin
			.from('documents')
			.select('user_id')
			.eq('id', payload.documentId)
			.single();

		if (error || !docRow) {
			return json({ success: false, error: 'document-not-found' }, { status: 404 });
		}

		if (docRow.user_id !== payload.userId) {
			return json({ success: false, error: 'unauthorized' }, { status: 403 });
		}

		const result = await reindexDocument(payload.documentId);
		return json({ success: true, result });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return json({ success: false, error: message }, { status: 400 });
	}
};
