import type { Player, AIAgent, Participant, Role } from '@/types';
import { AI_NONHUMAN_PERSONAS } from '$lib/data/ai-nonhumans';

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
	// ZD-179: Non-human representatives of the Aquarium (AVG).
	// Keep the same color/position (driven by `role`) but change persona name/cargo.
	// This mapping is intentionally stable so the assembly feels consistent.
	const personaNameByRole: Partial<Record<Role, string>> = {
		administration: 'Galeria', // bottom-left (lime)
		research: 'Tuga', // top-left (emerald)
		reception: 'Aquari', // top-center (sky)
		operations: 'Tropicus', // top-right (amber)
		bar: 'Doce', // bottom-right (red)
		// cleaning: (fallback below)
	};

	const defaultCycleNames = AI_NONHUMAN_PERSONAS.map((p) => p.name);
	
	for (let i = 0; i < count; i++) {
		const roleIndex = i % availableRoles.length;
		const role = availableRoles[roleIndex] || allRoles[i % allRoles.length];
		const fallbackNameIndex = i % defaultCycleNames.length;
		const name = personaNameByRole[role] ?? defaultCycleNames[fallbackNameIndex] ?? `AI ${i + 1}`;
		const personaKey =
			AI_NONHUMAN_PERSONAS.find((p) => p.name === name)?.key ?? AI_NONHUMAN_PERSONAS[fallbackNameIndex]?.key;
		
		agents.push({
			id: `ai-agent-${personaKey ?? i + 1}`,
			name,
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
	viewportHeight: number = 768,
	safeTopPx?: number,
	safeBottomPx?: number,
	offsetLeftPx: number = 0,
	offsetTopPx: number = 0,
	tableRect?: { x: number; y: number; width: number; height: number } | null,
	clampRect?: { left: number; top: number; width: number; height: number } | null,
	badgeSize?: { width: number; height: number } | null
): Array<{ angle: number; xPx: number; yPx: number }> {
	const positions: Array<{ angle: number; xPx: number; yPx: number }> = [];

	if (count <= 0) {
		return positions;
	}

	const useTableRect =
		!!tableRect && tableRect.width > 0 && tableRect.height > 0 && viewportWidth > 0 && viewportHeight > 0;

	let centerX: number;
	let centerY: number;
	let radiusX: number;
	let radiusY: number;
	let minX: number;
	let maxX: number;
	let minY: number;
	let maxY: number;

	if (useTableRect) {
		// Orbit around the actual aquarium/table image, then clamp to the safe-area boundary.
		// IMPORTANT:
		// We do a hard pixel clamp later (using `clampRect` + measured `badgeSize`) to guarantee badges
		// never leave the "correct limits". If we also pad here, we effectively double-clamp and the
		// top/bottom positions get pulled into the aquarium on smaller-height layouts (iPad mini / iPhone SE).
		const safeTop = safeTopPx ?? 0;
		const safeBottom = safeBottomPx ?? 0;
		minX = 0;
		maxX = 100;
		minY = (safeTop / viewportHeight) * 100;
		maxY = ((viewportHeight - safeBottom) / viewportHeight) * 100;

		const tableCenterXpx = tableRect.x + tableRect.width / 2;
		const tableCenterYpx = tableRect.y + tableRect.height / 2;
		centerX = (tableCenterXpx / viewportWidth) * 100;
		centerY = (tableCenterYpx / viewportHeight) * 100;

		// The SVG's outer "dotted ring" is ~rx=560 ry=340 inside a 1200x800 viewBox.
		// Use those ratios to align the orbit to the visible outer ring, then push out by badge size.
		const dottedRingRx = 560 / 600; // 0.9333...
		const dottedRingRy = 340 / 400; // 0.85
		const measuredW = badgeSize?.width ?? 80;
		const measuredH = badgeSize?.height ?? 90;
		const outsetGapX = Math.max(8, Math.min(24, Math.round(viewportWidth * 0.015)));
		const outsetGapY = Math.max(10, Math.min(32, Math.round(viewportHeight * 0.02)));
		const badgeOutsetXpx = measuredW / 2 + outsetGapX;
		const badgeOutsetYpx = measuredH / 2 + outsetGapY;
		const radiusXpx = (tableRect.width / 2) * dottedRingRx + badgeOutsetXpx;
		const radiusYpx = (tableRect.height / 2) * dottedRingRy + badgeOutsetYpx;
		radiusX = (radiusXpx / viewportWidth) * 100;
		radiusY = (radiusYpx / viewportHeight) * 100;
	} else {
		const config = getAquariumLayoutConfig(
			viewportWidth,
			viewportHeight,
			safeTopPx,
			safeBottomPx
		);
		({ centerX, centerY, radiusX, radiusY, minX, maxX, minY, maxY } = config);
	}

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
		const clampedX = Math.min(maxX, Math.max(minX, rawX));
		const clampedY = Math.min(maxY, Math.max(minY, rawY));

		let xPx = offsetLeftPx + (clampedX / 100) * viewportWidth;
		let yPx = offsetTopPx + (clampedY / 100) * viewportHeight;

		// Keep labels below the avatar everywhere, but avoid the top-half labels intersecting the aquarium.
		// For points in the upper half (sin < 0), push the badge slightly outward along the radial vector.
		if (useTableRect) {
			const isTopHalf = Math.sin(radian) < 0;
			if (isTopHalf) {
				const isMdUp = viewportWidth >= 768;
				const avatarDiameterPx = isMdUp ? 56 : 48;
				const measuredH = badgeSize?.height ?? (isMdUp ? 96 : 88);
				const labelBlockPx = Math.max(0, measuredH - avatarDiameterPx);
				// iPad mini landscape (and similar short-height landscape layouts) needs a bit more clearance
				// so the role text doesn't kiss the outer ring.
				const isCompactLandscape =
					isMdUp && viewportHeight > 0 && viewportHeight < 780 && viewportWidth / viewportHeight > 1.25;
				// Bias more aggressively on compact landscape so the label block clears the aquarium rim.
				const base = isCompactLandscape ? 18 : 6;
				const scale = isCompactLandscape ? 1.05 : 0.6;
				const nearTopBonus = Math.sin(radian) < -0.85 ? (isCompactLandscape ? 14 : 3) : 0;
				const extraOutsetPx = Math.max(
					0,
					Math.min(84, Math.round(labelBlockPx * scale + base + nearTopBonus))
				);
				xPx += Math.cos(radian) * extraOutsetPx;
				yPx += Math.sin(radian) * extraOutsetPx;
			}
		}

		// Hard clamp to the allowed boundary so badges can't escape the "correct limits"
		// (the red debug boundary, i.e. avatar-boundary).
		const isMdUp = viewportWidth >= 768;
		const fallbackW = isMdUp ? 90 : 80;
		const fallbackH = isMdUp ? 96 : 88;
		const badgeWidthPx = badgeSize?.width ?? fallbackW;
		const badgeHeightPx = badgeSize?.height ?? fallbackH;
		const halfW = badgeWidthPx / 2;
		const halfH = badgeHeightPx / 2;

		const boundsLeft = clampRect?.left ?? 0;
		const boundsTop = clampRect?.top ?? (safeTopPx ?? 0);
		const boundsRight = clampRect ? clampRect.left + clampRect.width : viewportWidth;
		const boundsBottom = clampRect ? clampRect.top + clampRect.height : viewportHeight - (safeBottomPx ?? 0);

		const clampedXPx = Math.min(boundsRight - halfW, Math.max(boundsLeft + halfW, xPx));
		const clampedYPx = Math.min(boundsBottom - halfH, Math.max(boundsTop + halfH, yPx));

		positions.push({ angle, xPx: clampedXPx, yPx: clampedYPx });
	}

	return positions;
}

function getAquariumLayoutConfig(
	viewportWidth: number,
	viewportHeight: number,
	safeTopPx?: number,
	safeBottomPx?: number
) {
	const isXs = viewportWidth < 480;
	const isShort = viewportHeight < 700;
	const isWide = viewportWidth / viewportHeight > 1.15;

	let topSafePx = safeTopPx ?? (isXs ? 200 : 150);
	let bottomSafePx = safeBottomPx ?? (isXs ? 200 : 170);
	const insetCap = isWide ? 40 : 56;
	const insetRatio = isWide ? 0.045 : 0.07;
	const participantInsetPx = Math.max(24, Math.min(insetCap, Math.round(viewportHeight * insetRatio)));
	topSafePx += participantInsetPx;
	bottomSafePx += participantInsetPx;

	let availableHeight = viewportHeight - topSafePx - bottomSafePx;
	if (availableHeight < 260) {
		const deficit = 260 - availableHeight;
		topSafePx = Math.max(120, topSafePx - deficit * 0.6);
		bottomSafePx = Math.max(140, bottomSafePx - deficit * 0.4);
		availableHeight = viewportHeight - topSafePx - bottomSafePx;
	}

	const marginPx = Math.max(24, Math.min(48, viewportWidth * 0.045));
	const centerXpx = viewportWidth / 2;
	const centerYpx = topSafePx + availableHeight / 2;
	let radiusXpx = Math.min(viewportWidth / 2 - marginPx, viewportWidth * 0.42);
	const radiusYpx = Math.max(
		60,
		Math.min(availableHeight / 2 - marginPx, viewportHeight * 0.28)
	);
	// Match the aquarium's oval (roughly 560x340 in the SVG) instead of over-squeezing on wide screens.
	radiusXpx = Math.min(radiusXpx, radiusYpx * 1.65);

	const centerX = (centerXpx / viewportWidth) * 100;
	const centerY = (centerYpx / viewportHeight) * 100;
	const radiusX = (radiusXpx / viewportWidth) * 100;
	const radiusY = (radiusYpx / viewportHeight) * 100;
	const minX = (marginPx / viewportWidth) * 100;
	const maxX = ((viewportWidth - marginPx) / viewportWidth) * 100;
	const minY = (topSafePx / viewportHeight) * 100;
	const maxY = ((viewportHeight - bottomSafePx) / viewportHeight) * 100;

	if (isShort) {
		const tighten = Math.min(8, (700 - viewportHeight) * 0.02);
		return {
			centerX,
			centerY: centerY + tighten,
			radiusX,
			radiusY: Math.max(18, radiusY - tighten),
			minX,
			maxX,
			minY,
			maxY: Math.max(minY + 18, maxY - tighten)
		};
	}

	return { centerX, centerY, radiusX, radiusY, minX, maxX, minY, maxY };
}
