import React from "react";
import type { PressableProps, StyleProp, View, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";
import { getHitSlop, resolveAccessibilityLabel } from "@/lib/accessibility";
import { useTheme } from "@/lib/theme-context";

const button = tv({
  slots: {
    container: "my-2 flex flex-row items-center justify-center rounded-full px-4",
    label: "font-inter text-base font-semibold",
    indicator: "h-6",
  },

  variants: {
    variant: {
      default: {
        container: "",
        label: "",
        indicator: "",
      },
      primary: {
        container: "",
        label: "",
        indicator: "",
      },
      secondary: {
        container: "bg-primary-600",
        label: "text-secondary-600",
        indicator: "text-white",
      },
      outline: {
        container: "",
        label: "",
        indicator: "",
      },
      destructive: {
        container: "",
        label: "text-white",
        indicator: "text-white",
      },
      ghost: {
        container: "bg-transparent",
        label: "underline",
        indicator: "",
      },
      link: {
        container: "bg-transparent",
        label: "",
        indicator: "",
      },
    },
    size: {
      default: {
        container: "h-12 px-4",
        label: "text-lg",
      },
      lg: {
        container: "h-14 px-8",
        label: "text-xl",
      },
      sm: {
        container: "h-10 px-3",
        label: "text-sm",
        indicator: "h-2",
      },
      icon: { container: "size-9" },
    },
    disabled: {
      true: {
        container: "",
        label: "",
        indicator: "",
      },
    },
    fullWidth: {
      true: {
        container: "",
      },
      false: {
        container: "self-center",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    disabled: false,
    fullWidth: true,
    size: "default",
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, "disabled"> {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<View, Props>(
  (
    {
      label: text,
      loading = false,
      variant = "default",
      disabled = false,
      size = "default",
      className = "",
      testID,
      textClassName = "",
      icon,
      style: propStyle,
      accessibilityLabel,
      accessibilityRole,
      hitSlop,
      ...props
    },
    ref
  ) => {
    const { colors, tokens } = useTheme();
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );

    const getContainerStyle = React.useCallback(
      function getContainerStyle() {
        if (disabled) {
          switch (variant) {
            case "default":
              return {
                backgroundColor: colors.foreground + "30",
              };
            case "primary":
              return {
                backgroundColor: colors.primary + "30",
              };
            case "secondary":
              return {
                backgroundColor: colors.muted,
              };
            case "destructive":
              return {
                backgroundColor: colors.destructive + "30",
              };
            case "outline":
              return {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.muted,
              };
            case "ghost":
            case "link":
              return {
                backgroundColor: "transparent",
              };
            default:
              return {
                backgroundColor: colors.muted,
              };
          }
        }

        switch (variant) {
          case "default":
            return {
              backgroundColor: colors.foreground,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            };
          case "primary":
            return {
              backgroundColor: colors.primary,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            };
          case "secondary":
            return {
              backgroundColor: colors.secondary,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            };
          case "outline":
            return {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: colors.border,
            };
          case "destructive":
            return {
              backgroundColor: colors.destructive,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            };
          case "ghost":
          case "link":
            return {
              backgroundColor: "transparent",
            };
          default:
            return {
              backgroundColor: colors.card,
            };
        }
      },
      [colors, disabled, variant]
    );

    const getLabelStyle = React.useCallback(
      function getLabelStyle() {
        if (disabled) {
          return { color: colors.mutedForeground };
        }

        switch (variant) {
          case "default":
            return { color: colors.background };
          case "primary":
            return { color: colors.primaryForeground };
          case "secondary":
            return { color: colors.secondaryForeground };
          case "outline":
            return { color: colors.foreground };
          case "destructive":
            return { color: colors.destructiveForeground };
          case "ghost":
          case "link":
            return { color: colors.foreground };
          default:
            return { color: colors.foreground };
        }
      },
      [colors, disabled, variant]
    );

    const getIndicatorColor = React.useCallback(
      function getIndicatorColor() {
        if (disabled) {
          return colors.mutedForeground;
        }

        switch (variant) {
          case "default":
            return colors.background;
          case "primary":
            return colors.primaryForeground;
          case "secondary":
            return colors.secondaryForeground;
          case "outline":
          case "ghost":
          case "link":
            return colors.foreground;
          case "destructive":
            return colors.destructiveForeground;
          default:
            return colors.foreground;
        }
      },
      [colors, disabled, variant]
    );

    const sizeStyle = React.useMemo(() => {
      switch (size) {
        case "lg":
          return {
            height: 56,
            paddingHorizontal: tokens.spacing.lg,
          };
        case "sm":
          return {
            height: 40,
            paddingHorizontal: tokens.spacing.sm,
          };
        case "icon":
          return {
            height: 36,
            width: 36,
            paddingHorizontal: 0,
          };
        case "default":
        default:
          return {
            height: 48,
            paddingHorizontal: tokens.spacing.md,
          };
      }
    }, [size, tokens.spacing]);

    const labelTypography = React.useMemo(() => {
      switch (size) {
        case "lg":
          return {
            fontSize: tokens.typography.sizes.lg,
            lineHeight: tokens.typography.lineHeights.lg,
          };
        case "sm":
          return {
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
          };
        case "icon":
          return {
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
          };
        case "default":
        default:
          return {
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
          };
      }
    }, [size, tokens.typography]);

    const labelStyle = React.useMemo(
      () =>
        StyleSheet.flatten([
          {
            fontWeight: tokens.typography.weights.semibold,
          },
          labelTypography,
          getLabelStyle(),
        ]),
      [getLabelStyle, labelTypography, tokens.typography.weights.semibold]
    );

    const containerStyle = React.useMemo(
      () =>
        StyleSheet.flatten([
          getContainerStyle(),
          sizeStyle,
          { borderRadius: tokens.radius.pill },
          propStyle,
        ]),
      [getContainerStyle, propStyle, sizeStyle, tokens.radius.pill]
    );

    const resolvedAccessibilityLabel = resolveAccessibilityLabel({
      label: text,
      accessibilityLabel,
    });

    return (
      <Pressable
        disabled={disabled || loading}
        className={styles.container({ className })}
        style={containerStyle as StyleProp<ViewStyle>}
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityLabel={resolvedAccessibilityLabel}
        hitSlop={hitSlop ?? getHitSlop()}
        {...props}
        ref={ref}
        testID={testID}>
        {props.children ? (
          props.children
        ) : (
          <>
            {icon && icon}
            {loading ? (
              <ActivityIndicator
                size="small"
                className={styles.indicator()}
                color={getIndicatorColor()}
                testID={testID ? `${testID}-activity-indicator` : undefined}
              />
            ) : (
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
                style={labelStyle}>
                {text}
              </Text>
            )}
          </>
        )}
      </Pressable>
    );
  }
);
