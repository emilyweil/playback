import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14181C',
        surface: '#1B2129',
        raised: '#232B34',
        line: '#2C343D',
        cream: '#EDE6D6',
        slate: '#8B95A1',
        amber: '#E8A33D',
        signal: '#4FA37A',
        rust: '#C4633B',
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
