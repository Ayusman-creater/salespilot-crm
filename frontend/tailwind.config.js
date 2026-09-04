/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: "#EAF3F0",
          100: "#CFE5DE",
          400: "#3A8B73",
          500: "#25795F",
          600: "#1F6F5C",
          700: "#195A4A",
          900: "#0F3A30",
        },
        red: {
          50: "#F7EDE9",
          100: "#EBD3CA",
          400: "#C46A4C",
          500: "#B3492E",
          600: "#943C26",
        },
        ink: {
          900: "#12151C",
          800: "#1B1F29",
          700: "#242938",
        },
        canvas: "#F5F4F1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}