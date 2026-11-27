import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'copas-azul': '#2456D6',
        'copas-marino': '#0F1B3D',
        'copas-dorado': '#E6B422',
        'copas-plata': '#C7CBD1',
        'copas-plata-oscuro': '#7D838C',
        'copas-crema': '#FAF7EF',
        'copas-verde': '#3E9B47',
        'copas-rojo': '#9C2A2A',
      },
      fontFamily: {
        heading: ['var(--font-nunito)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem',
      },
    },
  },
  plugins: [],
}
export default config
