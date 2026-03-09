/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: '#F5EFE6',
        cream: '#FAF7F2',
        espresso: '#1C1410',
        terracotta: '#C4622D',
        'terracotta-light': '#E8845A',
        sage: '#7A9E87',
        gold: '#D4A853',
        muted: '#8B7D72',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
