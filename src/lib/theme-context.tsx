import * as React from "react";
import { useColorScheme } from "nativewind";
import { themeTokens, type ThemeTokens } from "@/lib/theme-tokens";

type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  primaryGradient?: [string, string, string];
  secondary: string;
  secondaryForeground: string;
  destructive: string;
  destructiveForeground: string;
};

export const lightTheme: ThemeColors = {
  // Neutral “paper” with a tiny warm lift (no blue cast)
  background: "#F7F6F3",
  foreground: "#0B0D10",

  card: "#FFFFFF",
  cardForeground: "#0B0D10",

  // Muted surfaces for inputs/cards (neutral gray, not icy)
  muted: "#EFEDEA",
  mutedForeground: "#5C6674",

  // Subtle accent surface (still neutral)
  accent: "#E8E6E2",
  accentForeground: "#0B0D10",

  border: "#DEDAD3",
  input: "#FFFFFF",
  ring: "#F5B547",

  primary: "#F5B547",
  primaryForeground: "#1A1203",
  primaryGradient: ["#F7C35C", "#F5B547", "#E7A93A"],

  // Secondary should be neutral charcoal, not navy
  secondary: "#171A1F",
  secondaryForeground: "#FFFFFF",

  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
};

export const darkTheme: ThemeColors = {
  // True charcoal base, slightly warm/graphite (kills blue tint)
  background: "#0B0D10",
  foreground: "#F5F7FA",

  // Card = graphite, not blue-black
  card: "#121317",
  cardForeground: "#F5F7FA",

  // Muted surfaces for inputs (neutral graphite)
  muted: "#15161A",
  mutedForeground: "#A1A9B6",

  // Accent is a slightly lifted graphite (no navy)
  accent: "#1B1C21",
  accentForeground: "#F5F7FA",

  // Border should be neutral, low-contrast
  border: "#23252B",
  input: "#15161A",
  ring: "#F5B547",

  primary: "#F5B547",
  primaryForeground: "#140F03",
  primaryGradient: ["#F7C35C", "#F5B547", "#E7A93A"],

  // Secondary stays neutral; avoid blue
  secondary: "#1A1C22",
  secondaryForeground: "#EDEFF4",

  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
};

type ThemeContextType = {
  colors: ThemeColors;
  tokens: ThemeTokens;
  isDark: boolean;
};

const ThemeContext = React.createContext<ThemeContextType>({
  colors: lightTheme,
  tokens: themeTokens,
  isDark: false,
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors: themeColors, tokens: themeTokens, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
