import { OPENAI_API_KEY, OPENAI_MODEL } from '$env/static/private';
import { z } from 'zod';
import {
	AI_MESSAGE_MAX_CHARS,
	type AiAgentRole,
	type AiGenerateRequest,
	type AiGenerateResult,
	type AiGenerateSuccess
} from '../llm-types';

const DEFAULT_MODEL = OPENAI_MODEL || 'gpt-4o';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const messageResponseSchema = z.object({
	content: z.string().min(1).max(AI_MESSAGE_MAX_CHARS)
});

const roleSystemPrompts: Record<AiAgentRole, string> = {
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

function buildDiscussionPrompt(
	agentRole: AiAgentRole,
	round: number,
	proposalPoint: string | null,
	chatHistory: Array<{ content: string; senderType: string; senderName: string; round: number }>,
	latestUserMessage: string | null
): string {
	const recentUserMessages = chatHistory.filter((msg) => msg.senderType === 'human').slice(-3);
	const otherMessages = chatHistory.filter((msg) => msg.senderType !== 'human').slice(-7);

	let chatHistoryContext = '';
	if (recentUserMessages.length > 0 || otherMessages.length > 0) {
		chatHistoryContext = '\n\nDiscussion Context:\n';
		if (otherMessages.length > 0) {
			chatHistoryContext += otherMessages
				.map((msg) => `${msg.senderName} (Round ${msg.round}): ${msg.content}`)
				.join('\n');
		}
		if (recentUserMessages.length > 0) {
			if (otherMessages.length > 0) chatHistoryContext += '\n\n';
			chatHistoryContext += '=== RECENT USER INPUTS (RESPOND DIRECTLY TO THESE) ===\n';
			chatHistoryContext += recentUserMessages
				.map((msg) => `👤 Participant (Round ${msg.round}): ${msg.content}`)
				.join('\n');
		}
	}

	let latestUserContext = '';
	if (latestUserMessage) {
		latestUserContext = `\n\n=== MOST RECENT USER MESSAGE (RESPOND DIRECTLY TO THIS) ===\n👤 Participant: ${latestUserMessage}\n`;
	}

	let proposalContext = '';
	if (proposalPoint) {
		proposalContext = `\n\nCurrent Proposal Point (Round ${round}):\n${proposalPoint}`;
	}

	const messageCount = round === 7 ? 3 : Math.floor(Math.random() * 3) + 1;

	return `You are participating in a governance assembly discussion at Aquário Vasco da Gama.

Round: ${round}${round === 7 ? ' (Final Discussion Round - Full Debate)' : ''}
${proposalContext}${chatHistoryContext}${latestUserContext}

IMPORTANT: Your response MUST directly address and engage with the most recent user input(s) shown above. Do not just comment generically on the proposal point - respond specifically to what the participant(s) just said.

Generate ${messageCount} ${messageCount === 1 ? 'message' : 'messages'} that:
1. Directly responds to the most recent user input(s) - acknowledge what they said, agree/disagree with specific points, ask follow-up questions, or build on their ideas
2. Relates your response to the current proposal point
3. Reflects your role's perspective and expertise
${round === 7 ? '4. Engages in full debate, considering all aspects discussed' : '4. Provides focused commentary'}

CRITICAL REQUIREMENTS:
- Each message MUST be EXACTLY ONE SENTENCE ONLY (maximum one sentence per message)
- Be concise and relevant (max 200 characters per message)
- Directly reference what the user said
- Use natural, conversational language
- Be constructive and thoughtful
- Show that you're actively listening and responding to the discussion
- NO multiple sentences, NO compound sentences with "and" or "but" - just ONE simple, clear sentence

Return ONLY a JSON object with this format:
{
  "content": "Your single sentence message here"
}

${messageCount > 1 ? `Generate ${messageCount} separate messages. Return a JSON array with ${messageCount} objects. Each message must be exactly one sentence.` : ''}`;
}

export async function generateOpenAiDiscussionMessage(
	request: AiGenerateRequest
): Promise<AiGenerateResult> {
	if (!OPENAI_API_KEY) {
		return {
			success: false,
			error: {
				code: 'unauthorized',
				message: 'OpenAI API key is not configured.',
				provider: 'openai'
			}
		};
	}

	const systemPrompt = roleSystemPrompts[request.agentRole] ?? roleSystemPrompts.administration;
	const prompt = buildDiscussionPrompt(
		request.agentRole,
		request.round,
		request.proposalPoint ?? null,
		request.chatHistory ?? [],
		request.latestUserMessage ?? null
	);

	try {
		const response = await fetch(OPENAI_ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: DEFAULT_MODEL,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: prompt }
				],
				temperature: 0.7
			})
		});

		if (!response.ok) {
			const details = await response.text();
			return {
				success: false,
				error: {
					code: response.status === 429 ? 'rate_limited' : 'provider_error',
					message: 'OpenAI request failed.',
					details,
					provider: 'openai'
				}
			};
		}

		const payload = await response.json();
		const content = payload?.choices?.[0]?.message?.content;

		if (!content) {
			return {
				success: false,
				error: {
					code: 'provider_error',
					message: 'OpenAI returned an empty response.',
					provider: 'openai'
				}
			};
		}

		const parsed = JSON.parse(content);
		let result: string;
		if (Array.isArray(parsed)) {
			result = parsed.map((msg) => messageResponseSchema.parse(msg).content).join('\n\n');
		} else {
			result = messageResponseSchema.parse(parsed).content;
		}

		const success: AiGenerateSuccess = {
			success: true,
			provider: 'openai',
			model: DEFAULT_MODEL,
			message: {
				content: result,
				agentRole: request.agentRole,
				round: request.round,
				createdAt: new Date().toISOString()
			}
		};

		return success;
	} catch (error) {
		return {
			success: false,
			error: {
				code: 'provider_error',
				message: 'OpenAI request failed.',
				details: error instanceof Error ? error.message : String(error),
				provider: 'openai'
			}
		};
	}
}
