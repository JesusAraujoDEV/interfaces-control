/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{html,js,ejs}',
    '!./node_modules/**'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7f1',
          700: '#13532a',
          800: '#0f4a22'
        },
        OrganicModern: {
          "charlotte-green": '#357854', 
          "charlotte-brown": '#68291d', 
          "bg-cream": '#f6faf7'
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
