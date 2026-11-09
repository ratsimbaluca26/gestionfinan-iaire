/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#f0f6f1', 100: '#e1ede3', 600: '#3c7952', 700: '#2f6848', 800: '#214b36', 900: '#193b2b' },
        ink: '#1d2b24',
        paper: '#f7f8f5'
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        display: ['Manrope', 'DM Sans', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: { soft: '0 8px 30px rgba(29, 43, 36, 0.06)' }
    }
  },
  plugins: []
};
