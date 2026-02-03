export type AINonHumanPersonaKey = 'tuga' | 'tropicus' | 'galeria' | 'doce' | 'aquari';

export type AINonHumanPersona = {
	key: AINonHumanPersonaKey;
	name: string;
	cargoPt: string;
	cargoEn: string;
};

export const AI_NONHUMAN_PERSONAS: readonly AINonHumanPersona[] = [
	{
		key: 'tuga',
		name: 'Tuga',
		cargoPt: 'Fauna marinha Portuguesa',
		cargoEn: 'Portuguese marine fauna'
	},
	{
		key: 'tropicus',
		name: 'Tropicus',
		cargoPt: 'Fauna marinha Tropical',
		cargoEn: 'Tropical marine fauna'
	},
	{
		key: 'galeria',
		name: 'Galeria',
		cargoPt: 'Invertebrados',
		cargoEn: 'Invertebrates'
	},
	{
		key: 'doce',
		name: 'Doce',
		cargoPt: 'Fauna dulçaquícola\nTropical',
		cargoEn: 'Tropical freshwater\nfauna'
	},
	{
		key: 'aquari',
		name: 'Aquari',
		cargoPt: 'Não-humanos do AVG',
		cargoEn: 'AVG nonhumans'
	}
] as const;

export function getAINonHumanPersonaByName(name: string | null | undefined): AINonHumanPersona | null {
	const normalized = (name ?? '').trim().toLowerCase();
	if (!normalized) return null;
	return (
		AI_NONHUMAN_PERSONAS.find((p) => p.name.toLowerCase() === normalized) ??
		AI_NONHUMAN_PERSONAS.find((p) => p.key === (normalized as AINonHumanPersonaKey)) ??
		null
	);
}

export function getAINonHumanCargoLabel(
	name: string | null | undefined,
	locale: string | null | undefined
): string {
	const persona = getAINonHumanPersonaByName(name);
	if (!persona) return (name ?? '').trim() || '-';
	const lang = (locale ?? '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
	return lang === 'pt' ? persona.cargoPt : persona.cargoEn;
}

export function getAINonHumanFallbackMessages(
	name: string | null | undefined,
	locale: string | null | undefined
): string[] {
	const persona = getAINonHumanPersonaByName(name);
	const lang = (locale ?? '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
	const cargo =
		lang === 'pt'
			? persona?.cargoPt ?? 'Não-humanos do AVG'
			: persona?.cargoEn ?? 'AVG nonhumans';

	if (lang === 'pt') {
		return [
			`Como representante da ${cargo}, vejo pontos importantes a considerar.`,
			`Da perspetiva da ${cargo}, isto merece uma análise cuidadosa.`,
			`Enquanto voz da ${cargo}, concordo que este tema é relevante para o AVG.`
		];
	}

	return [
		`As a representative of ${cargo}, I see important points to consider.`,
		`From the perspective of ${cargo}, this deserves careful analysis.`,
		`As a voice for ${cargo}, I agree this topic is relevant for AVG.`
	];
}
