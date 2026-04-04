/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },
        coffee: {
          50: '#fcfaf8',
          100: '#f7ede3',
          200: '#ead7c7',
          300: '#d8b8a0',
          400: '#c19175',
          500: '#ad7456',
          600: '#9e634b',
          700: '#845041',
          800: '#451a03',
          900: '#290f02',
          950: '#1a0e08',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

