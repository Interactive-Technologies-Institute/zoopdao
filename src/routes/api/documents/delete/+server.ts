import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { deleteDocument } from '$lib/server/rag-ingest';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';

const deleteSchema = z.object({
	documentId: z.number().int().positive().optional(),
	storagePath: z.string().min(1),
	userId: z.string().min(1)
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const payload = deleteSchema.parse(body);

		if (payload.documentId) {
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
		}

		await deleteDocument({ documentId: payload.documentId, storagePath: payload.storagePath });
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return json({ success: false, error: message }, { status: 400 });
	}
};
