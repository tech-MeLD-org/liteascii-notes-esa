/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary red theme
        primary: '#e74c3c',
        'primary-light': '#ff6b5b',
        'primary-dark': '#c0392b',
        'primary-faint': 'rgba(231, 76, 60, 0.1)',
        'primary-soft': 'rgba(231, 76, 60, 0.22)',
        
        // Background colors
        bg: '#161618',
        'bg-secondary': '#1e1e20',
        'bg-card': '#242426',
        
        // Surface colors
        surface: '#1e1e20',
        'surface-hover': '#2a2a2c',
        
        // Text colors
        'text-main': '#e8e8e6',
        'text-secondary': '#a8a8a6',
        'text-muted': '#565658',
        
        // Border colors
        'border-color': '#303032',
        'border-light': '#424244',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
