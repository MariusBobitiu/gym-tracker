import * as React from "react";
import {
  useSelectedTheme,
  type ColorSchemeType,
} from "@/hooks/use-selected-theme";
import { Radio, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type ThemeOption = {
  value: ColorSchemeType;
  label: string;
};

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

type Props = {
  className?: string;
};

export function ThemeToggler({ className = "" }: Props): React.ReactElement {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const { colors, isDark } = useTheme();

  function handleThemeChange(theme: ColorSchemeType): void {
    setSelectedTheme(theme);
  }

  return (
    <View className={`gap-4 ${className}`}>
      <View className="flex-row items-center justify-between">
        <Text
          style={{ color: colors.foreground }}
          className="text-lg font-semibold"
        >
          Theme
        </Text>
        <Text style={{ color: colors.mutedForeground }} className="text-sm">
          {selectedTheme === "system"
            ? "System"
            : selectedTheme === "dark"
              ? "Dark"
              : "Light"}
        </Text>
      </View>

      <View className="gap-3">
        {themeOptions.map((option) => {
          const isSelected = selectedTheme === option.value;

          return (
            <Radio
              key={option.value}
              checked={isSelected}
              onChange={() => handleThemeChange(option.value)}
              label={option.label}
              accessibilityLabel={`Select ${option.label} theme`}
            />
          );
        })}
      </View>

      <View
        className="mt-2 rounded-lg p-3"
        style={{ backgroundColor: colors.muted }}
      >
        <Text style={{ color: colors.mutedForeground }} className="text-xs">
          Current theme: {isDark ? "Dark" : "Light"}
        </Text>
        <Text
          style={{ color: colors.mutedForeground }}
          className="mt-1 text-xs"
        >
          Background color: {colors.background}
        </Text>
      </View>
    </View>
  );
}
