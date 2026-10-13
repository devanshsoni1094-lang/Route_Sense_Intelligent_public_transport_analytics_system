/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vision: {
          bg: '#120f0e',
          glass: 'rgba(34, 30, 29, 0.78)',
          glassSolid: '#221e1d',
          glassBorder: 'rgba(255, 255, 255, 0.14)',
          coral: '#f43f5e',
          coralLight: '#fb7185',
          coralOrange: '#f97316',
          peach: '#fce7df',
          stoneDark: '#1a1615',
          stoneMuted: '#a8a29e',
        },
        brand: {
          50: '#fdf4f3',
          100: '#fce7df',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        }
      },
      boxShadow: {
        'vision-window': '0 30px 90px -10px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.12) inset',
        'vision-dock': '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.15) inset',
        'vision-card': '0 10px 30px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.08) inset',
      }
    },
  },
  plugins: [],
}
