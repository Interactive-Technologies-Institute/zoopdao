export type ZoopTheme = 'avg' | 'bos';

export const ZOOP_THEME: ZoopTheme = 'avg';

export function resolveZoopTheme(value?: string | null): ZoopTheme {
	if (!value) return ZOOP_THEME;
	return value.toLowerCase() === 'bos' ? 'bos' : ZOOP_THEME;
}

export function applyZoopTheme(target: HTMLElement | null = null) {
	const theme = resolveZoopTheme(ZOOP_THEME);

	if (!target && typeof document !== 'undefined') {
		target = document.documentElement;
	}

	if (target) {
		target.setAttribute('data-theme', theme);
	}

	return { theme };
}
