import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
        },
        accent: "var(--accent)",
        background: "var(--background)",
        surface: "var(--surface)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        border: "var(--border)",
      },
      fontFamily: {
        playfair: ["var(--font-playfair-next)", "serif"],
        poppins: ["var(--font-poppins-next)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
