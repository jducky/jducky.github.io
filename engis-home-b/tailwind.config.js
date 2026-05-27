/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        forest: "#0f3b2e",
        terracotta: "#bf4f24",
        cream: "#f5efe3",
        sand: "#ede6d8",
        navy: "#17263f",
      },
      fontFamily: {
        sans: ["Pretendard", "SUIT", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 24, 32, 0.08)",
      },
      maxWidth: {
        content: "1240px",
      },
    },
  },
  plugins: [],
};
