import React from "react";
import { View, type ViewProps } from "react-native";

import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

export type FormFieldProps = ViewProps & {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  hideError?: boolean;
};

export function FormField({
  label,
  helper,
  error,
  required = false,
  hideLabel = false,
  hideError = false,
  children,
  style,
  testID,
  ...props
}: FormFieldProps) {
  const { colors, tokens } = useTheme();
  const showLabel = Boolean(label) && !hideLabel;
  const showError = Boolean(error) && !hideError;
  const showHelper = Boolean(helper) && !showError;

  return (
    <View style={style} testID={testID} {...props}>
      {showLabel && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          style={{
            color: colors.foreground,
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
            fontWeight: tokens.typography.weights.medium,
            marginBottom: tokens.spacing.xs,
          }}
        >
          {label}
          {required ? " *" : ""}
        </Text>
      )}
      {children}
      {showHelper && (
        <Text
          testID={testID ? `${testID}-helper` : undefined}
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
            marginTop: tokens.spacing.xs,
          }}
        >
          {helper}
        </Text>
      )}
      {showError && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          style={{
            color: colors.destructive,
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
            marginTop: tokens.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
