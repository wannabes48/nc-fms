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
        sans: ['"Valley Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          hover: '#085041',
        },
        accent: '#185FA5',
        warning: '#BA7517',
        danger: '#A32D2D',
        bg: '#FAF9F6',
        surface: '#FFFFFF',
        border: '#E4E1D8',
        'text-primary': '#232420',
        'text-secondary': '#6B6A62',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
        pill: '9999px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
