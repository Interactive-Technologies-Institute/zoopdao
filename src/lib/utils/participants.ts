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
	currentPlayerIndex: number = 0,
	viewportWidth: number = 1024,
	viewportHeight: number = 768
): Array<{ angle: number; x: number; y: number; xVw: number; yVh: number }> {
	const positions: Array<{ angle: number; x: number; y: number; xVw: number; yVh: number }> = [];

	if (count <= 0) {
		return positions;
	}

	const config = getAquariumLayoutConfig(viewportWidth, viewportHeight);
	const { centerX, centerY, radiusX, radiusY, minX, maxX, minY, maxY } = config;

	// Bottom position is 90 degrees (6 o'clock position)
	const bottomAngle = 90;

	for (let i = 0; i < count; i++) {
		// Calculate relative position: rotate so current player is at bottom
		const relativeIndex = (i - currentPlayerIndex + count) % count;

		// Calculate angle: distribute evenly around circle starting from bottom
		const angle = bottomAngle + (relativeIndex * 360) / count;
		const radian = (angle * Math.PI) / 180;

		// Calculate x, y positions in viewport units
		const rawX = centerX + radiusX * Math.cos(radian);
		const rawY = centerY + radiusY * Math.sin(radian);
		const xVw = Math.min(maxX, Math.max(minX, rawX));
		const yVh = Math.min(maxY, Math.max(minY, rawY));

		// Also keep percentage for backward compatibility
		const x = xVw;
		const y = yVh;

		positions.push({ angle, x, y, xVw, yVh });
	}

	return positions;
}

function getAquariumLayoutConfig(viewportWidth: number, viewportHeight: number) {
	const isShort = viewportHeight < 700;
	const isXs = viewportWidth < 480;
	const isSm = viewportWidth >= 480 && viewportWidth < 768;
	const isMd = viewportWidth >= 768 && viewportWidth < 1024;

	let centerX = 50;
	let centerY = 50;
	let radiusX = 38;
	let radiusY = 26;
	let minX = 8;
	let maxX = 92;
	let minY = 14;
	let maxY = 84;

	if (isXs) {
		centerY = 56;
		radiusX = 42;
		radiusY = 28;
		minY = 18;
		maxY = 88;
	} else if (isSm) {
		centerY = 54;
		radiusX = 40;
		radiusY = 28;
		minY = 16;
		maxY = 86;
	} else if (isMd) {
		centerY = 52;
		radiusX = 38;
		radiusY = 26;
		minY = 14;
		maxY = 84;
	} else {
		centerY = 48;
		radiusX = 36;
		radiusY = 24;
		minX = 10;
		maxX = 90;
		minY = 12;
		maxY = 80;
	}

	if (isShort) {
		centerY = Math.min(58, centerY + 2);
		radiusY = Math.max(22, radiusY - 4);
		minY = Math.max(minY, 18);
		maxY = Math.min(maxY, 82);
	}

	return { centerX, centerY, radiusX, radiusY, minX, maxX, minY, maxY };
}
