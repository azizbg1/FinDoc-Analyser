/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          DEFAULT: "#ffffff",
          50:      "#f8fafc",
          100:     "#f1f5f9",
          200:     "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / .05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / .08), 0 1px 2px -1px rgb(0 0 0 / .06)",
        md: "0 4px 12px 0 rgb(0 0 0 / .08), 0 2px 4px -2px rgb(0 0 0 / .06)",
        lg: "0 8px 24px 0 rgb(0 0 0 / .10), 0 4px 8px  -4px rgb(0 0 0 / .07)",
      },
      animation: {
        "fade-up":    "fadeUp  0.35s ease-out both",
        "fade-in":    "fadeIn  0.25s ease-out both",
        "scale-in":   "scaleIn 0.20s ease-out both",
        "pulse-slow": "pulse   3s   ease-in-out infinite",
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.96)" },     to: { opacity: 1, transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
