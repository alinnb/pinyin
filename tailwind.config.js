/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'correct': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)', backgroundColor: '#dcfce7' },
          '100%': { transform: 'scale(1)' },
        },
        'wrong': {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '50%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-4px)' },
          '100%': { transform: 'translateX(0)' },
        },
        'active': {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'correct': 'correct 0.5s ease-out',
        'wrong': 'wrong 0.4s ease-out',
        'active': 'active 2s infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
