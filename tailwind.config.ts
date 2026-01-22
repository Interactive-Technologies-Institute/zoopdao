import type { Config } from 'tailwindcss';

const withAlpha = (cssVar: string) => `rgb(var(${cssVar}) / <alpha-value>)`;

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				white: 'rgb(255 255 255 / <alpha-value>)',
				black: 'rgb(0 0 0 / <alpha-value>)',
				background: withAlpha('--zd-bg'),
				'background-deep': withAlpha('--zd-bg-deep'),
				surface: withAlpha('--zd-surface'),
				'surface-muted': withAlpha('--zd-surface-muted'),
				border: withAlpha('--zd-border'),
				'border-strong': withAlpha('--zd-border-strong'),
				text: withAlpha('--zd-text'),
				'text-muted': withAlpha('--zd-text-muted'),
				'text-subtle': withAlpha('--zd-text-subtle'),
				primary: withAlpha('--zd-primary'),
				'primary-hover': withAlpha('--zd-primary-hover'),
				'primary-active': withAlpha('--zd-primary-active'),
				'primary-disabled': withAlpha('--zd-primary-disabled'),
				secondary: withAlpha('--zd-secondary'),
				'secondary-hover': withAlpha('--zd-secondary-hover'),
				'secondary-active': withAlpha('--zd-secondary-active'),
				tertiary: withAlpha('--zd-tertiary'),
				'tertiary-hover': withAlpha('--zd-tertiary-hover'),
				'tertiary-active': withAlpha('--zd-tertiary-active'),
				accent: withAlpha('--zd-accent'),
				focus: withAlpha('--zd-focus'),
				'deep-teal': withAlpha('--zd-primary'),
				'bright-aqua': withAlpha('--zd-primary-hover'),
				'dark-deep': withAlpha('--zd-primary-active'),
				'mist-gray': withAlpha('--zd-primary-disabled'),
				'sea-green': withAlpha('--zd-secondary'),
				'seafoam': withAlpha('--zd-secondary-hover'),
				'kelp': withAlpha('--zd-secondary-active'),
				sand: withAlpha('--zd-tertiary'),
				driftwood: withAlpha('--zd-surface'),
				slate: withAlpha('--zd-border'),
				charcoal: withAlpha('--zd-border-strong'),
				midnight: withAlpha('--zd-bg-deep'),
				ice: withAlpha('--zd-bg'),
				ink: withAlpha('--zd-text'),
				graphite: withAlpha('--zd-text-muted'),
				fog: withAlpha('--zd-text-subtle'),
				glow: withAlpha('--zd-focus')
			},
			fontFamily: {
				sans: ['Barlow', 'sans-serif'],
				serif: ['RobotoSlabVariable', 'serif']
			},
			animation: {
				'caret-blink': 'caret-blink 1.25s ease-out infinite',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				'caret-blink': {
					'0%,70%,100%': { opacity: '1' },
					'20%,50%': { opacity: '0' }
				},
				pulse: {
					'0%, 100%': { opacity: '1', r: '4' },
					'50%': { opacity: '0.5', r: '12' }
				}
			}
		}
	},

	plugins: []
} as Config;
