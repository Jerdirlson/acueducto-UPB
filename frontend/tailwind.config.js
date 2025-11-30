/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upb: {
          red: '#e3007b',
          dark: '#1a1a1a',
          gray: '#f4f4f4',
        }
      }
    },
  },
  plugins: [],
}

