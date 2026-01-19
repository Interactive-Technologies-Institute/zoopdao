import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				white: '#ffffff',
				text: '#0a1f22',
				'deep-teal': '#0c6b78',
				'bright-aqua': '#23c1d2',
				'dark-deep': '#05363d',
				'mist-gray': '#a8b3b3',
				'sea-green': '#6aa85a',
				'seafoam': '#7fb56b',
				'kelp': '#1a3f43',
				sand: '#b8b09c',
				driftwood: '#d7d2c3',
				slate: '#7f8a8a',
				charcoal: '#5b6464',
				midnight: '#0f1717',
				ice: '#c8fbff',
				ink: '#0a1f22',
				graphite: '#2f3a3a',
				fog: '#5b6464',
				glow: '#7fe3f2'
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
