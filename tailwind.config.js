/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        fontFamily: {
          mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        },
        colors: {
          amber: { brand: "#ff8a00" },
        },
      },
    },
    plugins: [],
  }