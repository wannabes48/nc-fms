import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Nyamira Conference Shared Design Language (Deep Green)
        brand: {
          DEFAULT: '#0F6E56', // primary
          hover: '#085041',   // primary-hover
          accent: '#185FA5',  // accent
          warning: '#BA7517', // warning
          danger: '#A32D2D',  // danger
          bg: '#FAF9F6',      // bg
          surface: '#FFFFFF', // surface
          border: '#E4E1D8',  // border
        },
        // ... shadcn default colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
