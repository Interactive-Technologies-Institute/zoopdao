import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

// Zod schemas for validation
const generateMessageSchema = z.object({
	gameId: z.number().int().positive(),
	proposalId: z.number().int().positive().nullable(),
	round: z.number().int().min(0).max(7),
	agentRole: z.enum(['administration', 'research', 'reception', 'operations', 'bar', 'cleaning']),
	proposalPoint: z.string().optional(), // Current round's proposal section content
	chatHistory: z.array(z.object({
		content: z.string(),
		senderType: z.enum(['human', 'ai']),
		senderName: z.string(),
		round: z.number()
	})).optional() // Previous messages for context
});

const messageResponseSchema = z.object({
	content: z.string().min(1).max(500)
});

/**
 * Get proposal point content for a specific round
 */
async function getProposalPoint(
	supabase: SupabaseClient,
	proposalId: number,
	round: number
): Promise<string | null> {
	const { data: proposal, error } = await supabase
		.from('proposals')
		.select('title, objectives, functionalities, discussion')
		.eq('id', proposalId)
		.single();

	if (error || !proposal) {
		return null;
	}

	// Map rounds to proposal sections
	switch (round) {
		case 0:
			return `Proposal Title: ${proposal.title}`;
		case 1:
		case 2:
			// Long-term objectives
			const objectives = proposal.objectives as Array<{ objective: string }>;
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
		case 7:
			return `Discussion: ${proposal.discussion}`;
		default:
			return null;
	}
}

/**
 * Generate AI message using Gemini API
 */
async function generateAIMessage(
	agentRole: string,
	round: number,
	proposalPoint: string | null,
	chatHistory: Array<{ content: string; senderType: string; senderName: string; round: number }> = []
): Promise<string> {
	const systemPrompt = roleSystemPrompts[agentRole] || roleSystemPrompts.administration;

	// Build chat history context
	let chatHistoryContext = '';
	if (chatHistory.length > 0) {
		chatHistoryContext = '\n\nPrevious Discussion Context:\n';
		chatHistoryContext += chatHistory
			.slice(-10) // Last 10 messages for context
			.map(msg => `${msg.senderName} (Round ${msg.round}): ${msg.content}`)
			.join('\n');
	}

	// Build proposal point context
	let proposalContext = '';
	if (proposalPoint) {
		proposalContext = `\n\nCurrent Proposal Point (Round ${round}):\n${proposalPoint}`;
	}

	// Determine message count based on round
	const messageCount = round === 7 ? 3 : Math.floor(Math.random() * 3) + 1; // 1-3 messages, 3 for round 7

	const prompt = `You are participating in a governance assembly discussion at Aquário Vasco da Gama.

Round: ${round}${round === 7 ? ' (Final Discussion Round - Full Debate)' : ''}
${proposalContext}${chatHistoryContext}

Generate ${messageCount} ${messageCount === 1 ? 'message' : 'messages'} commenting on the current proposal point.
${round === 7 ? 'This is the final discussion round. Provide comprehensive opinions and engage in full debate, considering all aspects discussed.' : 'Provide focused commentary on the specific proposal point.'}

Requirements:
- Be concise and relevant (max 500 characters per message)
- Reflect your role's perspective and expertise
- Consider the proposal context and previous discussion
- ${round === 7 ? 'Engage with other participants\' points and provide comprehensive analysis' : 'Focus on the specific proposal point'}
- Use natural, conversational language
- Be constructive and thoughtful

Return ONLY a JSON object with this format:
{
  "content": "Your message here"
}

${messageCount > 1 ? `Generate ${messageCount} separate messages. Return a JSON array with ${messageCount} objects.` : ''}`;

	try {
		const response = await ai.models.generateContent({
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

		if (!response.text) {
			throw new Error('Empty response from AI');
		}

		const parsed = JSON.parse(response.text);
		
		// Handle single message or array of messages
		if (Array.isArray(parsed)) {
			return parsed.map((msg: any) => msg.content).join('\n\n');
		}
		
		return parsed.content || parsed;
	} catch (error) {
		console.error('AI message generation error:', error);
		throw new Error('Failed to generate AI message');
	}
}

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validated = generateMessageSchema.parse(body);

		// Get proposal point content
		let proposalPoint: string | null = null;
		if (validated.proposalId) {
			proposalPoint = await getProposalPoint(supabase, validated.proposalId, validated.round);
		}

		// Generate AI message
		const messageContent = await generateAIMessage(
			validated.agentRole,
			validated.round,
			proposalPoint || validated.proposalPoint || null,
			validated.chatHistory || []
		);

		// Store message in database
		const { data: message, error: insertError } = await supabase
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
					chat_history_count: validated.chatHistory?.length || 0
				}
			})
			.select()
			.single();

		if (insertError) {
			console.error('Database insert error:', insertError);
			return json({ error: 'Failed to store message' }, { status: 500 });
		}

		return json({
			success: true,
			message: {
				id: message.id,
				content: message.content,
				agentRole: message.agent_role,
				round: message.round,
				createdAt: message.created_at
			}
		});
	} catch (error) {
		console.error('API error:', error);
		
		if (error instanceof z.ZodError) {
			return json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
		}

		return json(
			{ error: 'Failed to generate message' },
			{ status: 500 }
		);
	}
};

