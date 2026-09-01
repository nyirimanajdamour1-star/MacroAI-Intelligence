/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark terminal palette
        ink: {
          950: '#06080d',
          900: '#0a0e16',
          850: '#0d121d',
          800: '#111726',
          750: '#151c2e',
          700: '#1a2236',
          600: '#222c44',
          500: '#2c3854',
          400: '#3a4a6b',
        },
        bull: {
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
        },
        bear: {
          500: '#ef4444',
          400: '#f87171',
          300: '#fca5a5',
        },
        warn: {
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
        accent: {
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(59,130,246,0.15), 0 8px 30px -8px rgba(59,130,246,0.25)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
