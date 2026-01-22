export type ZoopTheme = 'avg' | 'bos';

export const ZOOP_THEME: ZoopTheme = 'avg';
export type ZoopFontProfile = 'loga' | 'arial';

export const ZOOP_FONT_PROFILE: ZoopFontProfile = 'loga';

export function resolveZoopTheme(value?: string | null): ZoopTheme {
	if (!value) return ZOOP_THEME;
	return value.toLowerCase() === 'bos' ? 'bos' : ZOOP_THEME;
}

export function resolveZoopFontProfile(value?: string | null): ZoopFontProfile {
	if (!value) return ZOOP_FONT_PROFILE;
	return value.toLowerCase() === 'arial' ? 'arial' : ZOOP_FONT_PROFILE;
}

export function applyZoopTheme(target: HTMLElement | null = null) {
	const theme = resolveZoopTheme(ZOOP_THEME);
	const fontProfile = resolveZoopFontProfile(ZOOP_FONT_PROFILE);

	if (!target && typeof document !== 'undefined') {
		target = document.documentElement;
	}

	if (target) {
		target.setAttribute('data-theme', theme);
		target.setAttribute('data-font', fontProfile);
	}

	return { theme, fontProfile };
}
