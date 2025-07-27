/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        construction: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        steel: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      backgroundImage: {
        'construction-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        'steel-gradient': 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
        'hero-gradient': 'linear-gradient(135deg, #f97316 0%, #64748b 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-gentle': 'bounce 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
