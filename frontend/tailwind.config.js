/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#0B2340',
        paper: '#F4F8FC',
        rail: '#082042',
        // Palette lifted straight from the eSebeLink logo: a blue pin/wordmark
        // wrapped by a green orbit swoosh.
        brand: {
          blue: '#0B63C9',
          blueDark: '#093880',
          blueLight: '#3FA9F5',
          green: '#1D8D41',
          greenDark: '#02973B',
          greenLight: '#6BCD20',
        },
        accent: {
          green: '#1D8D41',
          amber: '#B8863A',
          red: '#A6453D',
          blue: '#0B63C9',
        },
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #0B63C9 0%, #1D8D41 100%)',
      },
    },
  },
  plugins: [],
};
