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
        // Remap indigo → Granary forest green so existing indigo-* classes inherit the new brand.
        indigo: {
          50: "#f2f7f4",
          100: "#e4ede7",
          200: "#c5d9cb",
          300: "#9fbfa9",
          400: "#6b9a78",
          500: "#3d7a52",
          600: "#1a5336",
          700: "#164430",
          800: "#123628",
          900: "#0d281c",
          950: "#071912",
        },
        violet: {
          50: "#f2f7f4",
          100: "#e4ede7",
          200: "#c5d9cb",
          300: "#9fbfa9",
          400: "#6b9a78",
          500: "#3d7a52",
          600: "#1a5336",
          700: "#164430",
          800: "#123628",
          900: "#0d281c",
          950: "#071912",
        },
        purple: {
          50: "#f2f7f4",
          100: "#e4ede7",
          200: "#c5d9cb",
          300: "#9fbfa9",
          400: "#6b9a78",
          500: "#3d7a52",
          600: "#1a5336",
          700: "#164430",
          800: "#123628",
          900: "#0d281c",
          950: "#071912",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Granary: prefer hairline borders over heavy elevation
      boxShadow: {
        sm: "0 1px 0 rgba(16, 24, 20, 0.04)",
        DEFAULT: "0 1px 2px rgba(16, 24, 20, 0.05)",
        md: "0 1px 2px rgba(16, 24, 20, 0.05)",
        lg: "0 4px 14px rgba(16, 24, 20, 0.06)",
        xl: "0 8px 22px rgba(16, 24, 20, 0.07)",
        "2xl": "0 12px 28px rgba(16, 24, 20, 0.08)",
        inner: "inset 0 1px 0 rgba(16, 24, 20, 0.04)",
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
        "app-gradient": "linear-gradient(to bottom right, #f2f7f4, #eef2ef)",
        "app-gradient-dark": "linear-gradient(to bottom right, #0b1410, #122018)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
