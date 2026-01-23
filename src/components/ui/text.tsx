import React from "react";
import type { TextProps, TextStyle } from "react-native";
import { StyleSheet, Text as NNText } from "react-native";
import { twMerge } from "tailwind-merge";
import { useTheme } from "@/lib/theme-context";

interface Props extends TextProps {
  className?: string;
}

export const Text = ({ className = "", style, children, ...props }: Props) => {
  const { colors, tokens } = useTheme();

  const textStyle = React.useMemo(() => twMerge("font-inter", className), [className]);

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes.md,
          lineHeight: tokens.typography.lineHeights.md,
          fontWeight: tokens.typography.weights.regular,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );
  return (
    <NNText className={textStyle} style={nStyle} {...props}>
      {children}
    </NNText>
  );
};
