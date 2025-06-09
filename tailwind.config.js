/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        copper: {
          50: '#fdf8f0',
          100: '#faecd6',
          200: '#f4d6ac',
          300: '#ecba77',
          400: '#e29540',
          500: '#d4af37',
          600: '#b8892b',
          700: '#936825',
          800: '#795426',
          900: '#664623',
        },
        gray: {
          950: '#0a0a0a',
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(212,175,55,0.1) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};