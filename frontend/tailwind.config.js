/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        secondary: '#3B82F6',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Sarabun', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
