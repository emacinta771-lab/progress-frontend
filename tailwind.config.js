/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        icewhite: '#f8fafc',
        azure: {
          50: '#E5F4FF',
          100: '#B3D9F7',
          200: '#80BFF0',
          300: '#4DA4E8',
          400: '#1A8AE0',
          500: '#0078D4',
          600: '#0062B3',
          700: '#004C92',
          800: '#003671',
          900: '#002050',
        },
        teal: {
          50: '#f0fdf4',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        custom: {
          text: 'var(--text)',
          'text-h': 'var(--text-h)',
          bg: 'var(--bg)',
          border: 'var(--border)',
          'code-bg': 'var(--code-bg)',
          accent: 'var(--accent)',
          'accent-bg': 'var(--accent-bg)',
          'accent-border': 'var(--accent-border)',
          'social-bg': 'var(--social-bg)',
        },
        school: {
          primary: '#2c3e50',
          secondary: '#3498db',
          success: '#27ae60',
          danger: '#e74c3c',
          warning: '#f39c12',
          info: '#1abc9c',
        }
      },
      fontFamily: {
        sans: ['var(--sans)', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['var(--heading)', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--mono)', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        custom: 'var(--shadow)',
        'card': '0 2px 4px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 30px rgba(0,0,0,0.15)',
        'dropdown': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      maxWidth: {
        'full': '100%',
        'screen-xl': '1440px',
        'screen-2xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}