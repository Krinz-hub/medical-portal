/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        clinical: {
          slate: '#090D16',
          pine: '#0E4F43',
          'pine-hover': '#093C33',
          'pine-light': '#F0FDF8',
          porcelain: '#F7F9F9',
          amber: '#D97706',
          emerald: '#059669',
          rose: '#E11D48'
        },
        brand: {
          50: '#f0fdf8',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#0E4F43',
          800: '#093C33',
          900: '#062923',
          950: '#031713'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(9, 13, 22, 0.04)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.12s ease-out forwards'
      }
    }
  },
  plugins: []
};
