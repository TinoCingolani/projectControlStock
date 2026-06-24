/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#020617',
        },
      },
      backdropBlur: {
        '3xl': '64px',
        '4xl': '96px',
      },
      animation: {
        'spin-slow'    : 'spin 3s linear infinite',
        'float'        : 'float 6s ease-in-out infinite',
        'float-slow'   : 'float 9s ease-in-out infinite reverse',
        'shimmer-glass': 'shimmerGlass 3s ease-in-out infinite',
        'glow-pulse'   : 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%'     : { transform: 'translateY(-6px)' },
        },
        shimmerGlass: {
          '0%'  : { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%'     : { opacity: '1' },
        },
      },
      boxShadow: {
        'glass'      : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg'   : '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-cyan' : '0 8px 32px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-teal' : '0 8px 32px rgba(20,184,166,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-violet': '0 8px 32px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-emerald': '0 8px 32px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
