/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: '#ffffff',
          sidebar: '#f7f6f3',
          text: '#37352f',
          textLight: '#787774',
          border: '#e9e9e7',
          hover: '#f1f1ef',
          primary: '#2383e2',
        }
      }
    },
  },
  plugins: [],
}
