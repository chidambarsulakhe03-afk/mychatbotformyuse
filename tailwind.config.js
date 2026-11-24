/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gpt: {
          sidebar: {
            light: '#f9f9f9',
            dark: '#171717'
          },
          main: {
            light: '#ffffff',
            dark: '#212121'
          },
          message: {
            user: {
              light: '#f4f4f4',
              dark: '#303030'
            },
            assistant: {
              light: '#ffffff',
              dark: '#212121'
            }
          },
          input: {
            light: '#f4f4f4',
            dark: '#303030'
          },
          border: {
            light: '#e5e5e5',
            dark: '#2f2f2f'
          }
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
