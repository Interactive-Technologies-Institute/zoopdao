import type { AIMessage, AIAgent, Role } from '@/types';

/**
 * Generate AI messages for a specific round
 * For rounds 1-6: Agents comment on specific proposal point
 * For round 7: Full debate enabled
 */
export function generateAIMessages(
	agents: AIAgent[],
	round: number,
	proposalPoint?: string
): AIMessage[] {
	const messages: AIMessage[] = [];
	const messageCount = round === 7 ? 3 : Math.floor(Math.random() * 3) + 1; // 1-3 messages per agent
	
	for (const agent of agents) {
		const agentMessageCount = round === 7 ? messageCount : Math.min(messageCount, 2);
		
		for (let i = 0; i < agentMessageCount; i++) {
			messages.push({
				id: `msg-${agent.id}-r${round}-${i}`,
				agent_id: agent.id,
				round: round,
				content: generateMessageContent(agent, round, proposalPoint, i),
				created_at: new Date().toISOString()
			});
		}
	}
	
	return messages;
}

function generateMessageContent(
	agent: AIAgent,
	round: number,
	proposalPoint?: string,
	messageIndex: number = 0
): string {
	const rolePerspectives: Record<Role, string[]> = {
		administration: [
			'From an administrative perspective, we need to consider the practical implementation.',
			'We should evaluate the organizational impact and resource requirements.',
			'Administrative efficiency is crucial for this proposal.'
		],
		research: [
			'Research indicates that this approach has potential benefits.',
			'We need more data to fully understand the implications.',
			'From a research standpoint, this requires further investigation.'
		],
		reception: [
			'This would impact how we interact with visitors and stakeholders.',
			'We should consider the user experience implications.',
			'Reception services would need to adapt to this change.'
		],
		operations: [
			'Operational feasibility is a key concern here.',
			'We need to assess the day-to-day implementation challenges.',
			'Operations would need to be restructured to accommodate this.'
		],
		bar: [
			'This could affect our service delivery model.',
			'We should consider the customer-facing aspects.',
			'Service quality must be maintained throughout this transition.'
		],
		cleaning: [
			'Maintenance and sustainability are important factors.',
			'We need to ensure this doesn\'t create additional workload.',
			'From a maintenance perspective, this requires careful planning.'
		]
	};
	
	const perspectives = rolePerspectives[agent.role] || rolePerspectives.administration;
	const baseMessage = perspectives[messageIndex % perspectives.length];
	
	if (round === 7) {
		// Full debate in round 7
		return `${baseMessage} ${agent.name} believes we should discuss this thoroughly.`;
	} else if (proposalPoint) {
		// Comment on specific proposal point
		return `${baseMessage} Regarding "${proposalPoint.substring(0, 50)}...", ${agent.name} has some thoughts.`;
	} else {
		return baseMessage;
	}
}

