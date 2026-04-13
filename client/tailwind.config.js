/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0d0f1a",
          800: "#131629",
          700: "#1a1d2e",
          600: "#1f2338",
        },
        accent: {
          DEFAULT: "#6c63ff",
          hover: "#5a52e0",
        },
        success: "#4ade80",
        info: "#38bdf8",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "scan-down": "scanDown 2.2s ease-in-out infinite",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        scanDown: {
          "0%": { top: "0", opacity: 0 },
          "10%": { opacity: 1 },
          "90%": { opacity: 1 },
          "100%": { top: "100%", opacity: 0 },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: 0.6 },
          "100%": { transform: "scale(1.1)", opacity: 0 },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
