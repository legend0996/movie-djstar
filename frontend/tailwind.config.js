/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#E50914',
          hover: '#F40612',
          bg: '#0B0B0B',
          surface: '#181818',
          card: '#202020',
          border: '#2B2B2B',
          accent: '#F5C518',
        },
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
