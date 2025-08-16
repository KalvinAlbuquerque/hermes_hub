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
        // Paleta de Cores inspirada no "Oikonomos"
        'background': '#0D1117',       // Fundo preto/cinza-escuro
        'foreground': '#E6EDF3',       // Texto principal branco-acinzentado
        'card': '#161B22',             // Cards um pouco mais claros que o fundo
        'card-foreground': '#E6EDF3',

        'primary': {
          DEFAULT: '#2F81F7',       // Azul vibrante para ações principais
          foreground: '#FFFFFF',
        },
        'secondary': {
          DEFAULT: '#21262D',       // Cinza para botões secundários e fundos
          foreground: '#E6EDF3',
        },

        'destructive': {
          DEFAULT: '#DA3633',       // Vermelho para ações de perigo
          foreground: '#FFFFFF',
        },
        'success': {
          DEFAULT: '#238636',       // Verde para sucesso
          foreground: '#FFFFFF',
        },

        'muted': {
          DEFAULT: '#21262D',
          foreground: '#8D96A0',     // Cinza claro para texto secundário
        },

        'border': '#30363D',         // Cor da borda
        'input': '#0D1117',         // Fundo do input igual ao da página
        'ring': '#2F81F7',           // Anel de foco azul
      },
    },
  },
  plugins: [],
}