import { OpenAIEmbeddings } from '@langchain/openai';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_BASE_URL,
	OPENROUTER_EMBEDDING_MODEL,
	OPENROUTER_SITE_URL,
	OPENROUTER_APP_NAME
} from '$env/static/private';

const DEFAULT_EMBEDDING_MODEL = OPENROUTER_EMBEDDING_MODEL || 'baai/bge-m3';
const DEFAULT_BASE_URL = OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

function buildOpenRouterHeaders() {
	const headers: Record<string, string> = {};
	if (OPENROUTER_SITE_URL) {
		headers['HTTP-Referer'] = OPENROUTER_SITE_URL;
	}
	if (OPENROUTER_APP_NAME) {
		headers['X-Title'] = OPENROUTER_APP_NAME;
	}
	return headers;
}

export function createOpenRouterEmbeddings() {
	if (!OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not configured.');
	}

	return new OpenAIEmbeddings(
		{
			model: DEFAULT_EMBEDDING_MODEL,
			apiKey: OPENROUTER_API_KEY
		},
		{
			baseURL: DEFAULT_BASE_URL,
			defaultHeaders: buildOpenRouterHeaders()
		}
	);
}
