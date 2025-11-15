/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#161622",
          text: "#FFFFFF",
          accent: "#FF8C00"
        }
      }
    }
  },
  plugins: []
};
