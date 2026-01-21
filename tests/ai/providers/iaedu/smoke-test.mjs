import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import fs from 'node:fs';

const raw = fs.readFileSync('.env', 'utf8');
const env = {};

for (const line of raw.split('\n')) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
	const idx = trimmed.indexOf('=');
	const key = trimmed.slice(0, idx).trim();
	const value = trimmed.slice(idx + 1).trim();
	env[key] = value;
}

const endpoint = (env.IAEDU_ENDPOINT ||
	'https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream').replace(
	'/agent-chat//',
	'/agent-chat/'
);
const fallbackEndpoint = env.IAEDU_ENDPOINT_IP?.trim();
const apiKey = env.IAEDU_API_KEY;
const channelId = env.IAEDU_CHANNEL_ID;
const threadId = env.IAEDU_THREAD_ID;
const userId = env.IAEDU_USER_ID || 'local-smoke-test';
const userInfo = JSON.stringify({
	user_id: `zoopdao${createHash('sha256').update(userId).digest('hex')}`,
	input_source: 'auto'
});

if (!apiKey || !channelId || !threadId) {
	console.error('Missing IAEDU_API_KEY, IAEDU_CHANNEL_ID, or IAEDU_THREAD_ID in .env');
	process.exit(1);
}

async function resolveEndpoint(primary, fallback) {
	const url = new URL(primary);
	try {
		await lookup(url.hostname);
		return primary;
	} catch (error) {
		if (fallback) {
			console.warn(
				`DNS lookup failed for ${url.hostname}, using IAEDU_ENDPOINT_IP instead.`
			);
			return fallback;
		}
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`DNS lookup failed for ${url.hostname}: ${reason}`);
	}
}

const resolvedEndpoint = await resolveEndpoint(endpoint, fallbackEndpoint);

const formData = new FormData();
formData.append('channel_id', channelId);
formData.append('thread_id', threadId);
formData.append('user_info', userInfo);
formData.append('message', 'hello world');

const response = await fetch(resolvedEndpoint, {
	method: 'POST',
	headers: {
		'x-api-key': apiKey
	},
	body: formData
});

console.log(`IAEDU status: ${response.status}`);
const text = await response.text();

const events = [];
for (const line of text.split('\n')) {
	const trimmed = line.trim();
	if (!trimmed) continue;
	try {
		events.push(JSON.parse(trimmed));
	} catch {
		// Ignore non-JSON lines.
	}
}

let finalMessage = '';
let errorPayload = null;
let tokenBuffer = '';
for (const event of events) {
	if (event?.type === 'message' && typeof event?.content === 'string') {
		finalMessage = event.content;
	}
	if (event?.type === 'token' && typeof event?.content === 'string') {
		tokenBuffer += event.content;
	}
	if (event?.type === 'error') {
		errorPayload = event;
	}
}

if (errorPayload) {
	console.log('IAEDU error event:', JSON.stringify(errorPayload));
	process.exit(1);
}

if (finalMessage) {
	console.log(`IAEDU message: ${finalMessage}`);
	if (tokenBuffer.trim()) {
		console.log(`IAEDU token stream: ${tokenBuffer}`);
	}
} else {
	const preview = text.replace(/\s+/g, ' ').slice(0, 400);
	console.log(`IAEDU response preview: ${preview || '[empty]'}`);
	if (tokenBuffer.trim()) {
		console.log(`IAEDU message (from tokens): ${tokenBuffer}`);
	}
}
