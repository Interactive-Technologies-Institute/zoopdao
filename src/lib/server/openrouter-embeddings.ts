import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '$env/dynamic/private';

const DEFAULT_EMBEDDING_MODEL = env.OPENROUTER_EMBEDDING_MODEL || 'baai/bge-m3';
const DEFAULT_BASE_URL = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

function buildOpenRouterHeaders() {
	const headers: Record<string, string> = {};
	if (env.OPENROUTER_SITE_URL) {
		headers['HTTP-Referer'] = env.OPENROUTER_SITE_URL;
	}
	if (env.OPENROUTER_APP_NAME) {
		headers['X-Title'] = env.OPENROUTER_APP_NAME;
	}
	return headers;
}

export function createOpenRouterEmbeddings() {
	if (!env.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not configured.');
	}

	return new OpenAIEmbeddings(
		{
			model: DEFAULT_EMBEDDING_MODEL,
			apiKey: env.OPENROUTER_API_KEY
		},
		{
			baseURL: DEFAULT_BASE_URL,
			defaultHeaders: buildOpenRouterHeaders()
		}
	);
}
