import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#0d1117',
        sidebar: '#10161f',
        card: '#1a2235',
        'card-alt': '#1e2a3a',
        'nav-active': '#1e3a5f',
        'user-bubble': '#3b5af6',
        'send-btn': '#4f46e5',
        primary: '#f0f4f8',
        secondary: '#8892a4',
        'status-green': '#22c55e',
        'error-red': '#f87171',
        'error-bg': '#3d1515',
        'error-border': '#7f1d1d',
        border: '#1e2d40',
        'border-input': '#2a3a50',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
} satisfies Config
