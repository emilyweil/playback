import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7EF',
        ink: '#2B2A24',
        surface: '#FFFFFF',
        raised: '#F1ECDC',
        line: '#E4DECA',
        cream: '#2B2A24',
        slate: '#726B57',
        amber: '#BC2D47',
        signal: '#3F8F68',
        rust: '#B24B27',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      letterSpacing: {
        wide2: '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;
