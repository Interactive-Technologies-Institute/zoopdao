import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@src': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	plugins: [
		paraglideVitePlugin({ 
			project: './project.inlang', 
			outdir: './src/paraglide', 
			strategy: ['cookie', 'url', 'baseLocale'],
			disableAsyncLocalStorage: true }),

		sveltekit()],

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
