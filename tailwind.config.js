/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Force dark mode via class instead of media query
  content: [
    "./client/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-dark': 'rgb(var(--surface-dark) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        'code-bg': 'rgb(var(--code-bg) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      animation: {
        'in': 'animate-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
