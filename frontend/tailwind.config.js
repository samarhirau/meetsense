/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        brand: {
          bg: '#03070C', // Premium near-black slate
          surface: '#090D12', // Slate container
          surfaceHover: '#111822',
          accent: '#6366F1', // Indigo-500
          accentHover: '#4F46E5', // Indigo-600
          warning: '#F59E0B', // Amber
          text: {
            primary: '#F8FAFC', // Slate-50 high contrast text
            muted: '#94A3B8', // Slate-400 secondary text
          },
          border: '#17212B', // Micro-hairline border
          borderHover: '#263545',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
