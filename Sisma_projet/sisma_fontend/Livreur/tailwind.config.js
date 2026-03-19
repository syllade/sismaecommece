/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'DM Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        dmsans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        sisma: {
          red: '#D81918',
          orange: '#F7941D',
        },
      },
    },
  },
  plugins: [],
};
