import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        voicenter: {
          primary: 'hsl(0, 85%, 50%)',
          'primary-light': 'hsl(0, 85%, 85%)',
          'primary-dark': 'hsl(0, 85%, 25%)',
          success: 'hsl(148, 48%, 46%)',
          warning: 'hsl(47, 96%, 53%)',
          destructive: 'hsl(0, 70%, 45%)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

