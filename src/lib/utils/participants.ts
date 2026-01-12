import type { Player, AIAgent, Participant, Role } from '@/types';

const TOTAL_PARTICIPANTS = 6;
const MIN_HUMANS = 1;
const MIN_AI = 1;
const MAX_HUMANS = 5;
const MAX_AI = 5;

/**
 * Calculate how many AI agents are needed based on number of human players
 * Total must equal 6 participants (minimum 1 human + 1 AI, maximum 5 of each)
 */
export function calculateAIAgentsCount(humanCount: number): number {
	if (humanCount < MIN_HUMANS) {
		throw new Error(`Minimum ${MIN_HUMANS} human participant required`);
	}
	if (humanCount > MAX_HUMANS) {
		throw new Error(`Maximum ${MAX_HUMANS} human participants allowed`);
	}
	
	const aiCount = TOTAL_PARTICIPANTS - humanCount;
	
	if (aiCount < MIN_AI) {
		throw new Error(`Minimum ${MIN_AI} AI agent required`);
	}
	if (aiCount > MAX_AI) {
		throw new Error(`Maximum ${MAX_AI} AI agents allowed`);
	}
	
	return aiCount;
}

/**
 * Generate AI agents based on count needed
 */
export function generateAIAgents(count: number, existingRoles: Role[] = []): AIAgent[] {
	const allRoles: Role[] = ['administration', 'research', 'reception', 'operations', 'bar', 'cleaning'];
	const availableRoles = allRoles.filter(role => !existingRoles.includes(role));
	
	const agents: AIAgent[] = [];
	const aiNames = [
		'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan',
		'Casey', 'Riley', 'Quinn', 'Avery', 'Blake'
	];
	
	for (let i = 0; i < count; i++) {
		const roleIndex = i % availableRoles.length;
		const role = availableRoles[roleIndex] || allRoles[i % allRoles.length];
		const nameIndex = i % aiNames.length;
		
		agents.push({
			id: `ai-agent-${i + 1}`,
			name: aiNames[nameIndex] + (i > aiNames.length - 1 ? ` ${Math.floor(i / aiNames.length) + 1}` : ''),
			role: role
		});
	}
	
	return agents;
}

/**
 * Create participants list from human players and AI agents
 */
export function createParticipants(players: Player[], aiAgents: AIAgent[]): Participant[] {
	const participants: Participant[] = [];
	
	// Add human participants
	for (const player of players) {
		if (player.is_active !== false) {
			participants.push({ type: 'human', player });
		}
	}
	
	// Add AI agents
	for (const agent of aiAgents) {
		participants.push({ type: 'ai', agent });
	}
	
	return participants;
}

/**
 * Calculate positions around the aquarium table (circular arrangement)
 * Returns array of { angle, x, y } for positions in viewport units (vw, vh)
 * Current player is always positioned at the bottom (270 degrees)
 */
export function calculateAquariumPositions(
	count: number = TOTAL_PARTICIPANTS,
	currentPlayerIndex: number = 0
): Array<{ angle: number; x: number; y: number; xVw: number; yVh: number }> {
	const positions: Array<{ angle: number; x: number; y: number; xVw: number; yVh: number }> = [];
	
	// Use viewport center (50vw, 50vh)
	const centerX = 50; // Viewport width percentage
	const centerY = 50; // Viewport height percentage
	const radius = 35; // Viewport units distance from center (adjusted to keep all participants visible)
	
	// Bottom position is 90 degrees (6 o'clock position)
	const bottomAngle = 90;
	
	for (let i = 0; i < count; i++) {
		// Calculate relative position: rotate so current player is at bottom
		const relativeIndex = (i - currentPlayerIndex + count) % count;
		
		// Calculate angle: distribute evenly around circle starting from bottom
		const angle = bottomAngle + (relativeIndex * 360) / count;
		const radian = (angle * Math.PI) / 180;
		
		// Calculate x, y positions in viewport units
		const xVw = centerX + radius * Math.cos(radian);
		const yVh = centerY + radius * Math.sin(radian);
		
		// Also keep percentage for backward compatibility
		const x = xVw;
		const y = yVh;
		
		positions.push({ angle, x, y, xVw, yVh });
	}
	
	return positions;
}

