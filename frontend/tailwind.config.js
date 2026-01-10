/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        nordic: {
          sky: "#7DD3FC",
          teal: "#2DD4BF",
          meadow: "#4ADE80",
          cloudberry: "#FB923C",
          sunrise: "#FBBF24",
          midnight: "#1E3A5A",
          birch: "#FEFCE8",
          snow: "#FAFAF9",
          mist: "#E7E5E4",
          coral: "#F87171",
        },
      },
      fontFamily: {
        sans: ["var(--font-lexend)", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
