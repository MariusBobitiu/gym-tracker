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

const lightTheme: ThemeColors = {
  background: colors.white,
  foreground: colors.black,
  card: colors.white,
  cardForeground: colors.black,
  muted: colors.neutral[100],
  mutedForeground: colors.neutral[500],
  accent: colors.neutral[100],
  accentForeground: colors.black,
  border: colors.neutral[200],
  input: colors.neutral[200],
  ring: colors.primary[400],
  primary: colors.primary[400],
  primaryForeground: colors.white,
  secondary: colors.neutral[100],
  secondaryForeground: colors.black,
  destructive: colors.danger[500],
  destructiveForeground: colors.white,
};

const darkTheme: ThemeColors = {
  background: colors.charcoal[950],
  foreground: colors.charcoal[100],
  card: colors.charcoal[850],
  cardForeground: colors.charcoal[100],
  muted: colors.charcoal[850],
  mutedForeground: colors.neutral[400],
  accent: colors.charcoal[800],
  accentForeground: colors.charcoal[100],
  border: colors.charcoal[800],
  input: colors.charcoal[800],
  ring: colors.primary[200],
  primary: colors.primary[200],
  primaryForeground: colors.black,
  secondary: colors.charcoal[800],
  secondaryForeground: colors.charcoal[100],
  destructive: colors.danger[600],
  destructiveForeground: colors.white,
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
