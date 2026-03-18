/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          900: '#0a0f1c', // Fondo muy oscuro
          800: '#111827', // Panel oscuro
          700: '#1f2937', // Panel elevado
          accent: '#00e6f0', // Cian brillante
          glow: 'rgba(0, 230, 240, 0.5)', // Brillo cian
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}