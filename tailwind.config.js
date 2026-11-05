/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          '"Public Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Remap indigo → steel blue-grey so existing indigo-* classes inherit the new brand.
        indigo: {
          50: "#f4f6f9",
          100: "#f0f3f7",
          200: "#d8e0ea",
          300: "#b8c5d6",
          400: "#8fa3b8",
          500: "#5a6f86",
          600: "#3d4f66",
          700: "#2c3b4f",
          800: "#151d2a",
          900: "#0b1017",
          950: "#06090e",
        },
        violet: {
          50: "#f4f6f9",
          100: "#f0f3f7",
          200: "#d8e0ea",
          300: "#b8c5d6",
          400: "#8fa3b8",
          500: "#5a6f86",
          600: "#3d4f66",
          700: "#2c3b4f",
          800: "#151d2a",
          900: "#0b1017",
          950: "#06090e",
        },
        purple: {
          50: "#f4f6f9",
          100: "#f0f3f7",
          200: "#d8e0ea",
          300: "#b8c5d6",
          400: "#8fa3b8",
          500: "#5a6f86",
          600: "#3d4f66",
          700: "#2c3b4f",
          800: "#151d2a",
          900: "#0b1017",
          950: "#06090e",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Prefer hairline borders over heavy elevation
      boxShadow: {
        sm: "0 1px 0 rgba(11, 16, 23, 0.04)",
        DEFAULT: "0 1px 2px rgba(11, 16, 23, 0.05)",
        md: "0 1px 2px rgba(11, 16, 23, 0.05)",
        lg: "0 4px 14px rgba(11, 16, 23, 0.06)",
        xl: "0 8px 22px rgba(11, 16, 23, 0.07)",
        "2xl": "0 12px 28px rgba(11, 16, 23, 0.08)",
        inner: "inset 0 1px 0 rgba(11, 16, 23, 0.04)",
        none: "none",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        "app-gradient": "linear-gradient(to bottom right, #f4f6f9, #e8eef4)",
        "app-gradient-dark": "linear-gradient(to bottom right, #0b1017, #151d2a)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
