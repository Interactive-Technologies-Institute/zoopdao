import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/supabase';
import {
	AI_AGENT_ROLES,
	AI_DEFAULT_TIMEOUT_MS,
	AI_MAX_RETRIES,
	AI_MESSAGE_MAX_CHARS,
	type AiAgentRole,
	type AiGenerateResult,
	type AiGenerateSuccess
} from '@/lib/ai/llm-types';
import { generateAIMessageIaedu } from '@/lib/ai/providers/iaedu';
import { retrieveRagChunks } from '$lib/server/rag-retrieve';

// #region agent log
if (!GEMINI_API_KEY) {
	console.error('GEMINI_API_KEY is not set');
}
// #endregion

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// Configure the active provider in code instead of relying on .env values.
const ACTIVE_PROVIDER: 'gemini' | 'iaedu' = 'iaedu';

// Rate limiting: 5 requests per minute
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// In-memory rate limit tracker
// Stores timestamps of recent requests
const rateLimitTracker: number[] = [];

/**
 * Check if rate limit is exceeded
 * @returns true if rate limit is exceeded, false otherwise
 */
function checkRateLimit(): boolean {
	const now = Date.now();
	
	// Remove timestamps older than 1 minute
	while (rateLimitTracker.length > 0 && rateLimitTracker[0] < now - RATE_LIMIT_WINDOW_MS) {
		rateLimitTracker.shift();
	}
	
	// Check if we've exceeded the limit
	if (rateLimitTracker.length >= RATE_LIMIT_REQUESTS) {
		return true;
	}
	
	// Add current request timestamp
	rateLimitTracker.push(now);
	return false;
}

/**
 * Get time until next request is allowed (in seconds)
 */
function getTimeUntilNextRequest(): number {
	if (rateLimitTracker.length === 0) return 0;
	
	const oldestRequest = rateLimitTracker[0];
	const now = Date.now();
	const timeUntilOldestExpires = (oldestRequest + RATE_LIMIT_WINDOW_MS) - now;
	
	return Math.ceil(timeUntilOldestExpires / 1000);
}

// System prompts for each AI agent role
const roleSystemPrompts: Record<string, string> = {
	administration: `You are an Administration role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Organizational operations and policy management
- Administrative processes and efficiency
- Strategic planning and coordination
- Resource allocation and management
- Compliance and regulatory considerations

You provide thoughtful, structured input on proposals, considering administrative feasibility, resource requirements, and organizational impact. Your comments are professional, clear, and focused on practical implementation aspects.`,

	research: `You are a Research role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Scientific research and studies
- Marine life and ecosystem knowledge
- Evidence-based decision making
- Data analysis and interpretation
- Long-term scientific implications

You contribute insights based on scientific knowledge, research findings, and evidence. Your comments emphasize the importance of data-driven decisions and consider the scientific validity and long-term research implications of proposals.`,

	reception: `You are a Reception role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Visitor experience and engagement
- Front desk operations and customer service
- Public communication and information sharing
- Visitor feedback and needs
- Accessibility and inclusivity

You bring the visitor perspective to discussions, emphasizing how proposals might affect visitor experience, accessibility, and public engagement. Your comments are practical and consider the day-to-day interactions with visitors.`,

	operations: `You are an Operations role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Technical operations including electricity and plumbing
- Facility maintenance and infrastructure
- Operational feasibility and technical requirements
- Safety and technical standards
- Practical implementation challenges

You provide technical expertise and practical insights on operational aspects. Your comments address feasibility, technical requirements, maintenance considerations, and safety implications of proposals.`,

	bar: `You are a Bar role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Bar services and food & beverage operations
- Visitor hospitality and service quality
- Revenue generation and business operations
- Food safety and service standards
- Visitor satisfaction through food services

You contribute insights on hospitality, service quality, and business operations. Your comments consider visitor satisfaction, service standards, and the practical aspects of food and beverage operations.`,

	cleaning: `You are a Cleaning role participant in the Aquário Vasco da Gama governance assembly. Your perspective focuses on:
- Cleanliness and hygiene standards
- Maintenance of facility cleanliness
- Health and safety through cleanliness
- Practical cleaning operations
- Environmental hygiene considerations

You emphasize the importance of cleanliness, hygiene, and health standards. Your comments focus on practical cleaning operations, health considerations, and maintaining high cleanliness standards throughout the facility.`
};

const RAG_CONTEXT_MAX_CHARS = 1200;
const RAG_CONTEXT_MAX_CHUNKS = 6;

// Zod schemas for validation
const generateMessageSchema = z.object({
	gameId: z.number().int().positive(),
	proposalId: z.number().int().positive().nullable(),
	round: z.number().int().min(0).max(7),
	agentRole: z.enum(AI_AGENT_ROLES),
	userId: z.string().min(1).optional(),
	inputSource: z.enum(['manual', 'auto']).optional(),
	proposalPoint: z.string().optional(), // Current round's proposal section content
	chatHistory: z.array(z.object({
		content: z.string(),
		senderType: z.enum(['human', 'ai']),
		senderName: z.string(),
		round: z.number()
	})).optional(), // Previous messages for context
	latestUserMessage: z.string().nullable().optional() // Most recent user message to respond to
});

const messageResponseSchema = z.object({
	content: z.string().min(1).max(AI_MESSAGE_MAX_CHARS)
});

function buildRagContext(
	chunks: Array<{ content: string; similarity: number; metadata: Record<string, unknown> }>,
	maxChars: number
): string {
	let used = 0;
	const lines: string[] = [];

	for (let index = 0; index < chunks.length; index += 1) {
		const chunk = chunks[index];
		const filename =
			typeof chunk.metadata.filename === 'string' ? chunk.metadata.filename : 'document';
		const similarity = Number.isFinite(chunk.similarity)
			? chunk.similarity.toFixed(3)
			: 'n/a';
		const header = `[${index + 1}] ${filename} (similarity ${similarity})`;
		const content = chunk.content.trim();
		const entry = `${header}\n${content}`;

		if (used + entry.length > maxChars) {
			const remaining = Math.max(maxChars - used - header.length - 1, 0);
			if (remaining <= 0) break;
			lines.push(`${header}\n${content.slice(0, remaining)}`.trim());
			break;
		}

		lines.push(entry);
		used += entry.length + 1;
	}

	return lines.join('\n\n');
}

/**
 * Get proposal point content for a specific round
 */
async function getProposalPoint(
	supabaseClient: typeof supabase,
	proposalId: number,
	round: number
): Promise<string | null> {
	const { data: proposal, error } = await supabaseClient
		.from('proposals')
		.select('title, objectives, functionalities')
		.eq('id', proposalId)
		.single();

	if (error || !proposal) {
		return null;
	}

	// Map rounds to proposal sections
	const objectives = proposal.objectives as Array<any>;
	
	switch (round) {
		case 0:
			return `Proposal Title: ${proposal.title}`;
		case 1:
		case 2:
			// Long-term objectives
			if (round === 1 && objectives[0]) {
				return `Long-term Objective 1: ${objectives[0].objective || 'N/A'}`;
			}
			if (round === 2 && objectives[1]) {
				return `Long-term Objective 2: ${objectives[1].objective || 'N/A'}`;
			}
			return null;
		case 3:
			// Preconditions and Goals
			const allPreconditions: string[] = [];
			(objectives || []).forEach((obj: any, idx: number) => {
				if (obj.preconditions) {
					obj.preconditions.forEach((prec: any, pIdx: number) => {
						allPreconditions.push(`Objective ${idx + 1}, Precondition ${pIdx + 1}: ${prec.precondition || 'N/A'}`);
					});
				}
			});
			return allPreconditions.join('\n') || null;
		case 4:
			// Indicative Steps
			const allSteps: string[] = [];
			(objectives || []).forEach((obj: any, idx: number) => {
				if (obj.preconditions) {
					obj.preconditions.forEach((prec: any, pIdx: number) => {
						if (prec.indicative_steps) {
							prec.indicative_steps.forEach((step: any, sIdx: number) => {
								allSteps.push(`Objective ${idx + 1}, Precondition ${pIdx + 1}, Step ${sIdx + 1}: ${step.step || 'N/A'}`);
							});
						}
					});
				}
			});
			return allSteps.join('\n') || null;
		case 5:
			// Key Indicators
			const allIndicators: string[] = [];
			(objectives || []).forEach((obj: any, idx: number) => {
				if (obj.preconditions) {
					obj.preconditions.forEach((prec: any, pIdx: number) => {
						if (prec.key_indicators) {
							prec.key_indicators.forEach((ind: any, iIdx: number) => {
								allIndicators.push(`Objective ${idx + 1}, Precondition ${pIdx + 1}, Indicator ${iIdx + 1}: ${ind.indicator || 'N/A'}`);
							});
						}
					});
				}
			});
			return allIndicators.join('\n') || null;
		case 6:
			return `Functionalities: ${proposal.functionalities}`;
		default:
			return null;
	}
}

/**
 * Retry helper with exponential backoff for API calls
 */
async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = AI_MAX_RETRIES,
	initialDelay: number = 1000
): Promise<T> {
	let lastError: Error | unknown;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error: any) {
			lastError = error;
			
			// Check if it's a 503 error (service unavailable) or rate limit error
			const isRetryable = error?.status === 503 || 
				error?.status === 429 || 
				error?.message?.includes('overloaded') ||
				error?.message?.includes('rate limit');
			
			if (!isRetryable || attempt === maxRetries) {
				throw error;
			}
			
			// Calculate delay with exponential backoff
			const delay = initialDelay * Math.pow(2, attempt);
			
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:retry',message:'Retrying API call',data:{attempt:attempt+1,maxRetries,delay,errorStatus:error?.status,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'RETRY'})}).catch(()=>{});
			// #endregion
			
			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	
	throw lastError;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	let timeoutId: NodeJS.Timeout;
	const timeoutPromise = new Promise<T>((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function buildErrorResponse(params: {
	code: 'invalid_request' | 'rate_limited' | 'provider_unavailable' | 'provider_error' | 'timeout' | 'unauthorized' | 'unknown';
	message: string;
	details?: string;
	retryAfterSeconds?: number;
	provider?: 'gemini' | 'iaedu';
}): AiGenerateResult {
	return {
		success: false,
		error: {
			code: params.code,
			message: params.message,
			details: params.details,
			retryAfterSeconds: params.retryAfterSeconds,
			provider: params.provider
		}
	};
}

/**
 * Generate AI message using Gemini API with retry logic
 */
async function generateAIMessageGemini(
	agentRole: AiAgentRole,
	round: number,
	proposalPoint: string | null,
	ragContext: string | null,
	chatHistory: Array<{ content: string; senderType: string; senderName: string; round: number }> = [],
	latestUserMessage: string | null = null
): Promise<string> {
	const systemPrompt = roleSystemPrompts[agentRole] || roleSystemPrompts.administration;

	// Separate recent user messages from the rest of the history
	const recentUserMessages = chatHistory
		.filter(msg => msg.senderType === 'human')
		.slice(-3); // Last 3 user messages
	
	const otherMessages = chatHistory
		.filter(msg => msg.senderType !== 'human' || !recentUserMessages.includes(msg))
		.slice(-7); // Last 7 other messages for context

	// Build chat history context with emphasis on user messages
	let chatHistoryContext = '';
	if (recentUserMessages.length > 0 || otherMessages.length > 0) {
		chatHistoryContext = '\n\nDiscussion Context:\n';
		
		// Add other messages first for background
		if (otherMessages.length > 0) {
			chatHistoryContext += otherMessages
				.map(msg => `${msg.senderName} (Round ${msg.round}): ${msg.content}`)
				.join('\n');
		}
		
		// Highlight recent user messages
		if (recentUserMessages.length > 0) {
			if (otherMessages.length > 0) chatHistoryContext += '\n\n';
			chatHistoryContext += '=== RECENT USER INPUTS (RESPOND DIRECTLY TO THESE) ===\n';
			chatHistoryContext += recentUserMessages
				.map(msg => `👤 Participant (Round ${msg.round}): ${msg.content}`)
				.join('\n');
		}
	}

	// Include latest user message if provided separately
	let latestUserContext = '';
	if (latestUserMessage) {
		latestUserContext = `\n\n=== MOST RECENT USER MESSAGE (RESPOND DIRECTLY TO THIS) ===\n👤 Participant: ${latestUserMessage}\n`;
	}

	// Build proposal point context
	let proposalContext = '';
	if (proposalPoint) {
		proposalContext = `\n\nCurrent Proposal Point (Round ${round}):\n${proposalPoint}`;
	}

	let ragContextBlock = '';
	if (ragContext) {
		ragContextBlock = `\n\nRAG Context (Round ${round}):\n${ragContext}`;
	}

	// Determine message count based on round
	const messageCount = round === 7 ? 3 : Math.floor(Math.random() * 3) + 1; // 1-3 messages, 3 for round 7

	const prompt = `You are participating in a governance assembly discussion at Aquário Vasco da Gama.

Round: ${round}${round === 7 ? ' (Final Discussion Round - Full Debate)' : ''}
${proposalContext}${ragContextBlock}${chatHistoryContext}${latestUserContext}

IMPORTANT: Your response MUST directly address and engage with the most recent user input(s) shown above. Do not just comment generically on the proposal point - respond specifically to what the participant(s) just said.

Generate ${messageCount} ${messageCount === 1 ? 'message' : 'messages'} that:
1. Directly responds to the most recent user input(s) - acknowledge what they said, agree/disagree with specific points, ask follow-up questions, or build on their ideas
2. Relates your response to the current proposal point
3. Reflects your role's perspective and expertise
${round === 7 ? '4. Engages in full debate, considering all aspects discussed' : '4. Provides focused commentary'}

CRITICAL REQUIREMENTS:
- Each message MUST be EXACTLY ONE SENTENCE ONLY (maximum one sentence per message)
- Be concise and relevant (max 200 characters per message)
- Directly reference what the user said (e.g., "I agree with your point about...", "You mentioned X, and from my perspective...", "That's an interesting idea, but we should also consider...")
- Use natural, conversational language
- Be constructive and thoughtful
- Show that you're actively listening and responding to the discussion
- NO multiple sentences, NO compound sentences with "and" or "but" - just ONE simple, clear sentence

Return ONLY a JSON object with this format:
{
  "content": "Your single sentence message here"
}

${messageCount > 1 ? `Generate ${messageCount} separate messages. Return a JSON array with ${messageCount} objects. Each message must be exactly one sentence.` : ''}`;

	// #region agent log
	fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:222',message:'generateAIMessage START',data:{agentRole,round,proposalPoint:proposalPoint?.substring(0,100),chatHistoryLength:chatHistory.length,messageCount,systemPromptLength:systemPrompt.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C'})}).catch(()=>{});
	// #endregion

	try {
		// Use retry logic for the API call
		const response = await retryWithBackoff(async () => {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:225',message:'Calling Gemini API',data:{model:'gemini-2.5-flash',promptLength:prompt.length,hasSystemPrompt:!!systemPrompt,messageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
			// #endregion

			return await ai.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: prompt,
				config: {
					thinkingConfig: {
						thinkingBudget: 0
					},
					responseMimeType: 'application/json',
					responseJsonSchema: messageCount > 1 
						? z.toJSONSchema(z.array(messageResponseSchema))
						: z.toJSONSchema(messageResponseSchema),
					systemInstruction: systemPrompt
				}
			});
		}, 3, 1000); // 3 retries with 1s initial delay

		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:245',message:'Gemini API response received',data:{hasText:!!response.text,textLength:response.text?.length,textPreview:response.text?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,D'})}).catch(()=>{});
		// #endregion

		if (!response.text) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:250',message:'Empty response from AI',data:{response:JSON.stringify(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
			// #endregion
			throw new Error('Empty response from AI');
		}

		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:256',message:'Parsing JSON response',data:{textPreview:response.text.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
		// #endregion

		const parsed = JSON.parse(response.text);
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:260',message:'JSON parsed successfully',data:{isArray:Array.isArray(parsed),parsedType:typeof parsed,parsedKeys:Object.keys(parsed)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
		// #endregion
		
		// Handle single message or array of messages
		let result: string;
		if (Array.isArray(parsed)) {
			result = parsed.map((msg: any) => msg.content).join('\n\n');
		} else {
			result = parsed.content || parsed;
		}

		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:270',message:'generateAIMessage END',data:{resultLength:result.length,resultPreview:result.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
		// #endregion

		return result;
	} catch (error: any) {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:275',message:'AI message generation error',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
		// #endregion
		console.error('AI message generation error:', error);
		
		// Provide more specific error messages
		if (error?.status === 503 || error?.message?.includes('overloaded')) {
			throw new Error('provider_unavailable');
		}
		if (error?.status === 429 || error?.message?.includes('rate limit')) {
			throw new Error('rate_limited');
		}

		throw new Error(error?.message || 'provider_error');
	}
}

export const POST: RequestHandler = async ({ request }) => {
	// #region agent log
	fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:296',message:'POST handler START',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
	// #endregion

	// Ensure anonymous session exists
	let { data: { session } } = await supabase.auth.getSession();
	
	if (!session) {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:303',message:'No session, signing in anonymously',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
		// #endregion
		
		const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
		
		if (signInError || !signInData.session) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:308',message:'Failed to sign in anonymously',data:{error:signInError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
			// #endregion
			return json({ error: 'Failed to authenticate' }, { status: 401 });
		}
		
		session = signInData.session;
	}

	try {
		const body = await request.json();
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:265',message:'Request body received',data:{bodyKeys:Object.keys(body),gameId:body.gameId,proposalId:body.proposalId,round:body.round,agentRole:body.agentRole},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
		// #endregion

	const validated = generateMessageSchema.parse(body);
	const inputSource = validated.inputSource ?? (validated.latestUserMessage ? 'manual' : 'auto');
		
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:270',message:'Request validated',data:{validated},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
		// #endregion

		// Get proposal point content
		let proposalPoint: string | null = null;
		if (validated.proposalId) {
			proposalPoint = await getProposalPoint(supabase, validated.proposalId, validated.round);
		}

		let ragContext: string | null = null;
		let ragContextCount = 0;
		if (validated.proposalId && validated.round === 7) {
			const query =
				validated.latestUserMessage?.trim() ||
				proposalPoint?.trim() ||
				validated.proposalPoint?.trim();
			if (query) {
				try {
					const chunks = await retrieveRagChunks({
						query,
						proposalId: validated.proposalId,
						round: validated.round,
						topK: RAG_CONTEXT_MAX_CHUNKS
					});
					ragContextCount = chunks.length;
					if (chunks.length > 0) {
						ragContext = buildRagContext(chunks, RAG_CONTEXT_MAX_CHARS);
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					// #region agent log
					fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:rag',message:'RAG retrieval failed',data:{errorMessage:message,proposalId:validated.proposalId,round:validated.round},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'RAG'})}).catch(()=>{});
					// #endregion
				}
			}
		}

		// Generate AI message
		// Check if message already exists for this agent in this round
		// Type assertion needed because discussion_messages table not in generated types yet
		const supabaseAny = supabase as any;
		const { data: existingMessage } = await supabaseAny
			.from('discussion_messages')
			.select('id, content, agent_role, round, created_at')
			.eq('game_id', validated.gameId)
			.eq('round', validated.round)
			.eq('participant_type', 'ai_agent')
			.eq('agent_role', validated.agentRole)
			.single();

		// If message already exists, return it instead of generating a new one
		if (existingMessage) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:340',message:'Message already exists for this agent/round, returning existing',data:{agentRole:validated.agentRole,round:validated.round,messageId:existingMessage.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
			// #endregion

			const response: AiGenerateSuccess = {
				success: true,
				provider: 'gemini',
				model: 'gemini-2.5-flash',
				message: {
					id: existingMessage.id,
					content: existingMessage.content,
					agentRole: existingMessage.agent_role as AiAgentRole,
					round: existingMessage.round,
					createdAt: existingMessage.created_at
				}
			};

			return json(response);
		}

		let messageContent: string;
		let provider: 'gemini' | 'iaedu' = 'gemini';
		let model = 'gemini-2.5-flash';

		if (ACTIVE_PROVIDER === 'iaedu') {
			let aiResult: AiGenerateResult;
			try {
				aiResult = await withTimeout(
					generateAIMessageIaedu({
						gameId: validated.gameId,
						proposalId: validated.proposalId,
						round: validated.round,
						agentRole: validated.agentRole,
						userId: validated.userId ?? null,
						inputSource,
						proposalPoint: proposalPoint || validated.proposalPoint || undefined,
						ragContext: ragContext || undefined,
						chatHistory: validated.chatHistory,
						latestUserMessage: validated.latestUserMessage ?? null
					}),
					AI_DEFAULT_TIMEOUT_MS
				);
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				const code = reason === 'timeout' ? 'timeout' : 'provider_error';
				const response = buildErrorResponse({
					code,
					message: code === 'timeout' ? 'AI request timed out.' : 'Failed to generate AI message.',
					details: reason,
					provider: 'iaedu'
				});
				return json(response, { status: code === 'timeout' ? 504 : 500 });
			}

			if (!aiResult.success) {
				const status =
					aiResult.error.code === 'rate_limited'
						? 429
						: aiResult.error.code === 'unauthorized'
							? 401
							: aiResult.error.code === 'provider_unavailable'
								? 503
								: 500;

				return json(aiResult, { status });
			}

			messageContent = aiResult.message.content;
			provider = aiResult.provider;
			model = aiResult.model;
		} else {
			// Check rate limit before calling Gemini API
			if (checkRateLimit()) {
				const waitTime = getTimeUntilNextRequest();
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:rateLimit',message:'Rate limit exceeded',data:{waitTime,currentRequests:rateLimitTracker.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'RATE_LIMIT'})}).catch(()=>{});
				// #endregion
				const response = buildErrorResponse({
					code: 'rate_limited',
					message: `Rate limit exceeded. Maximum ${RATE_LIMIT_REQUESTS} requests per minute.`,
					retryAfterSeconds: waitTime,
					provider: 'gemini'
				});
				return json(response, { status: 429 });
			}

			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:273',message:'Calling generateAIMessage',data:{agentRole:validated.agentRole,round:validated.round,hasProposalPoint:!!proposalPoint,chatHistoryLength:validated.chatHistory?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
			// #endregion

			try {
				messageContent = await withTimeout(
					generateAIMessageGemini(
						validated.agentRole,
						validated.round,
						proposalPoint || validated.proposalPoint || null,
						ragContext,
						validated.chatHistory || [],
						validated.latestUserMessage || null
					),
					AI_DEFAULT_TIMEOUT_MS
				);
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				const code =
					reason === 'timeout'
						? 'timeout'
						: reason === 'rate_limited'
							? 'rate_limited'
							: reason === 'provider_unavailable'
								? 'provider_unavailable'
								: 'provider_error';

				const response = buildErrorResponse({
					code,
					message:
						code === 'timeout'
							? 'AI request timed out.'
							: code === 'rate_limited'
								? 'Rate limit exceeded. Please wait before retrying.'
								: code === 'provider_unavailable'
									? 'AI service is temporarily unavailable.'
									: 'Failed to generate AI message.',
					details: reason,
					provider: 'gemini'
				});

				const status =
					code === 'rate_limited'
						? 429
						: code === 'provider_unavailable'
							? 503
							: code === 'timeout'
								? 504
								: 500;

				return json(response, { status });
			}
		}

		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:282',message:'Message generated, storing in DB',data:{messageContentLength:messageContent.length,messageContentPreview:messageContent.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
		// #endregion

		// Store message in database
		const { data: message, error: insertError } = await supabaseAny
			.from('discussion_messages')
			.insert({
				game_id: validated.gameId,
				proposal_id: validated.proposalId,
				round: validated.round,
				participant_type: 'ai_agent',
				agent_role: validated.agentRole,
				content: messageContent,
				metadata: {
					proposal_point: proposalPoint,
					chat_history_count: validated.chatHistory?.length || 0,
					rag_context_count: ragContextCount,
					rag_context_chars: ragContext?.length ?? 0
				}
			})
			.select()
			.single();

		if (insertError) {
			// Check if error is due to unique constraint violation (message already exists)
			if (insertError.code === '23505' || insertError.message?.includes('unique')) {
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:377',message:'Unique constraint violation, fetching existing message',data:{agentRole:validated.agentRole,round:validated.round},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
				// #endregion

				// Fetch the existing message
				const { data: existingMsg } = await supabaseAny
					.from('discussion_messages')
					.select('id, content, agent_role, round, created_at')
					.eq('game_id', validated.gameId)
					.eq('round', validated.round)
					.eq('participant_type', 'ai_agent')
					.eq('agent_role', validated.agentRole)
					.single();

				if (existingMsg) {
					const response: AiGenerateSuccess = {
						success: true,
						provider: 'gemini',
						model: 'gemini-2.5-flash',
						message: {
							id: existingMsg.id,
							content: existingMsg.content,
							agentRole: existingMsg.agent_role as AiAgentRole,
							round: existingMsg.round,
							createdAt: existingMsg.created_at
						}
					};

					return json(response);
				}
			}

			console.error('Database insert error:', insertError);
			return json({ error: 'Failed to store message' }, { status: 500 });
		}

		const response: AiGenerateSuccess = {
			success: true,
			provider,
			model,
			message: {
				id: (message as any).id,
				content: (message as any).content,
				agentRole: (message as any).agent_role as AiAgentRole,
				round: (message as any).round,
				createdAt: (message as any).created_at
			}
		};

		return json(response);
	} catch (error: any) {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/37357ea7-fbc2-42a4-91b4-62ceeaddd590',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/+server.ts:314',message:'API error caught',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,isZodError:error instanceof z.ZodError,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
		// #endregion

		console.error('API error:', error);
		
		if (error instanceof z.ZodError) {
			const response = buildErrorResponse({
				code: 'invalid_request',
				message: 'Invalid request data.',
				details: JSON.stringify(error.issues)
			});
			return json(response, { status: 400 });
		}

		// Provide user-friendly error messages
		const errorMessage = error instanceof Error ? error.message : String(error);
		let statusCode = 500;
		let code: 'provider_unavailable' | 'rate_limited' | 'provider_error' | 'unknown' = 'provider_error';

		if (errorMessage.includes('temporarily unavailable') || errorMessage.includes('overloaded')) {
			statusCode = 503;
			code = 'provider_unavailable';
		} else if (errorMessage.includes('rate limit')) {
			statusCode = 429;
			code = 'rate_limited';
		} else if (error?.status === 503) {
			statusCode = 503;
			code = 'provider_unavailable';
		} else if (error?.status === 429) {
			statusCode = 429;
			code = 'rate_limited';
		}

		const response = buildErrorResponse({
			code,
			message:
				code === 'provider_unavailable'
					? 'AI service is temporarily unavailable.'
					: code === 'rate_limited'
						? 'Rate limit exceeded. Please wait before retrying.'
						: 'Failed to generate message.',
			details: errorMessage,
			provider: ACTIVE_PROVIDER
		});

		return json(response, { status: statusCode });
	}
};
