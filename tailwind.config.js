/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hopscotch: {
          // Primary colours
          'fresh-air': '#b1c8f6',
          'marmalade': '#fd884a',
          'forest': '#1f4435',
          // Secondary colours
          'sunshine': '#fbee57',
          'pebble': '#f2eeed',
          'apple': '#6d9f6b',
          'smiles': '#fae1e9',
          // Tints for UI
          'fresh-air-light': '#e7eefc',
          'marmalade-light': '#fedbc8',
          'sunshine-light': '#fdfacc',
          'forest-light': '#e8ecea',
        }
      },
      fontFamily: {
        // Ivar Display for headers (using similar serif fallbacks)
        display: ['"Playfair Display"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Greycliffe for body (using similar sans fallbacks)
        body: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
