/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f3',
          100: '#fce8e6',
          200: '#f9d4d1',
          300: '#f4b4ae',
          400: '#ec8b82',
          500: '#e06459',
          600: '#cb4638',
          700: '#aa382c',
          800: '#8d3128',
          900: '#762e27',
        },
        sage: {
          50: '#f6f7f4',
          100: '#e3e7dd',
          200: '#c8d0be',
          300: '#a7b397',
          400: '#889775',
          500: '#6b7a59',
          600: '#546145',
          700: '#434d38',
          800: '#383f30',
          900: '#30372b',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
