/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#F4F1EA',
          DEFAULT: '#F4F1EA',
          card: '#FAF8F4',
          subtle: '#EAE5D9',
          border: '#DCD7CC',
          dark: '#141312',
          'dark-card': '#1C1A18',
          'dark-subtle': '#24211E',
          'dark-border': '#2B2824'
        },
        ink: {
          DEFAULT: '#191816',
          muted: '#5C5852',
          faint: '#8C867E',
          dark: '#F5F2EB',
          'dark-muted': '#A8A29A',
          'dark-faint': '#6B665F'
        },
        accent: {
          DEFAULT: '#B85D38', // Burnt terracotta
          hover: '#9E4E2D',
          muted: '#F5EBE6',
          dark: '#D9774F',
          'dark-muted': '#36221A'
        },
        teal: {
          DEFAULT: '#2C5D63', // Editorial deep teal
          muted: '#E6EFF0',
          dark: '#4B8890'
        },
        semantic: {
          up: '#3E6B48',
          'up-bg': '#EAF2EB',
          down: '#A64438',
          'down-bg': '#FAECEB'
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderWidth: {
        'hairline': '1px',
      }
    },
  },
  plugins: [],
}
