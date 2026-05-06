/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', "sans-serif"],
        body: ['"Space Grotesk"', "sans-serif"],
      },
      colors: {
        nb: {
          paper: "#F5F3EA",
          ink: "#111111",
          yellow: "#FFED00",
          cyan: "#57D5F6",
          coral: "#FF7A59",
          mint: "#8BFFCA",
          gray: "#D4D0C5",
        },
      },
      boxShadow: {
        nb: "6px 6px 0 #111111",
        nbLg: "10px 10px 0 #111111",
      },
    },
  },
  plugins: [],
}
