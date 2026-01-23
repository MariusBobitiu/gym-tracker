const colors = require("./src/components/ui/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,tsx}", "./src/components/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...colors,
        // Theme colors that work with dark mode
        background: {
          DEFAULT: colors.white,
          dark: colors.charcoal[950],
        },
        foreground: {
          DEFAULT: colors.black,
          dark: colors.charcoal[100],
        },
        card: {
          DEFAULT: colors.white,
          dark: colors.charcoal[850],
        },
        "card-foreground": {
          DEFAULT: colors.black,
          dark: colors.charcoal[100],
        },
        muted: {
          DEFAULT: colors.neutral[100],
          dark: colors.charcoal[850],
        },
        "muted-foreground": {
          DEFAULT: colors.neutral[500],
          dark: colors.neutral[400],
        },
        accent: {
          DEFAULT: colors.neutral[100],
          dark: colors.charcoal[800],
        },
        "accent-foreground": {
          DEFAULT: colors.black,
          dark: colors.charcoal[100],
        },
        border: {
          DEFAULT: colors.neutral[200],
          dark: colors.charcoal[800],
        },
        input: {
          DEFAULT: colors.neutral[200],
          dark: colors.charcoal[800],
        },
        ring: {
          DEFAULT: colors.primary[400],
          dark: colors.primary[200],
        },
        primary: {
          ...colors.primary,
          DEFAULT: colors.primary[400],
          foreground: {
            DEFAULT: colors.white,
            dark: colors.black,
          },
        },
        secondary: {
          DEFAULT: colors.neutral[100],
          dark: colors.charcoal[800],
          foreground: {
            DEFAULT: colors.black,
            dark: colors.charcoal[100],
          },
        },
        destructive: {
          DEFAULT: colors.danger[500],
          dark: colors.danger[600],
          foreground: {
            DEFAULT: colors.white,
            dark: colors.white,
          },
        },
      },
    },
  },
  plugins: [],
};
