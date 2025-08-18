/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // A sua paleta de cores permanece a mesma
        'background': '#0D1117',
        'foreground': '#E6EDF3',
        'card': '#161B22',
        'card-foreground': '#E6EDF3',
        'primary': {
          DEFAULT: '#2F81F7',
          foreground: '#FFFFFF',
        },
        'secondary': {
          DEFAULT: '#21262D',
          foreground: '#E6EDF3',
        },
        'destructive': {
          DEFAULT: '#DA3633',
          foreground: '#FFFFFF',
        },
        'success': {
          DEFAULT: '#238636',
          foreground: '#FFFFFF',
        },
        'muted': {
          DEFAULT: '#21262D',
          foreground: '#8D96A0',
        },
        'border': '#30363D',
        'input': '#0D1117',
        'ring': '#2F81F7',
      },
    },
  },
  // CORREÇÃO: Adiciona o plugin de tipografia.
  plugins: [
    require('@tailwindcss/typography'),
  ],
}