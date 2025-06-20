/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#28715E',
        'secondary': '#632420',
        'accent': '#C95C2C',
        'dark': '#1C1A1A',
        'light': '#E8AC49',
      },
    },
  },
  plugins: [],
}