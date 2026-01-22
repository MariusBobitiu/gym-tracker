import * as React from 'react';
import { useColorScheme } from 'nativewind';
import colors from '@/components/ui/colors';

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
  secondary: string;
  secondaryForeground: string;
  destructive: string;
  destructiveForeground: string;
};

export const lightTheme: ThemeColors = {
  background: "#F7F8FA",
  foreground: "#0B0D10",

  card: "#FFFFFF",
  cardForeground: "#0B0D10",

  muted: "#EEF2F7",
  mutedForeground: "#5A6676",

  accent: "#EAEFF6",
  accentForeground: "#0B0D10",

  border: "#D7DFEA",
  input: "#FFFFFF",
  ring: "#ffa90a",

  primary: "#ffa90a",
  primaryForeground: "#1A1203",

  secondary: "#111827",
  secondaryForeground: "#FFFFFF",

  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
};

export const darkTheme: ThemeColors = {
  background: "#0B0D10",
  foreground: "#F5F7FA",

  card: "#10141A",
  cardForeground: "#F5F7FA",

  muted: "#151B24",
  mutedForeground: "#9AA4B2",

  accent: "#1A2230",
  accentForeground: "#F5F7FA",

  border: "#1F2A3A",
  input: "#121824",
  ring: "#ffa90a",

  primary: "#ffa90a",
  primaryForeground: "#140F03",

  secondary: "#1A2330",
  secondaryForeground: "#E7ECF3",

  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",
};

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = React.createContext<ThemeContextType>({
  colors: lightTheme,
  isDark: false,
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors: themeColors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
