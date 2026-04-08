/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f9f9',
          100: '#d7f0f0',
          200: '#b4e2e2',
          300: '#84cdce',
          400: '#5fb4a9',
          500: '#439790',
          600: '#007f92',
          700: '#006575',
          800: '#00497B',
          900: '#003357'
        },
        casita: {
          green: { dark: '#00692F', DEFAULT: '#618B2F', light: '#8EC152' },
          gold: '#6D5F24',
          peach: '#F49A6D',
          red: '#E83F4B',
        },
        iedis: {
          blue: { dark: '#00497B', light: '#66A8D8', DEFAULT: '#66A8D8' },
          teal: { dark: '#007F92', DEFAULT: '#5FB4A9' },
          yellow: '#FCBF2C',
          red: '#762728',
        },
        inst: {
          gray: { DEFAULT: '#86888C', dark: '#50535A' }
        }
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0, 0, 0, 0.02)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}