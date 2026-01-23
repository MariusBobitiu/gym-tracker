import React from "react";
import { MotiView } from "moti";
import { ActivityIndicator, View, type DimensionValue, type ViewProps } from "react-native";

import { Button, Text } from "@/components/ui";
import { useReducedMotion } from "@/lib/motion";
import { useTheme } from "@/lib/theme-context";

type BaseStateProps = ViewProps & {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  style,
  ...props
}: BaseStateProps) {
  const { colors, tokens } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: tokens.spacing.xl,
          paddingHorizontal: tokens.spacing.lg,
        },
        style,
      ]}
      {...props}>
      <Text
        style={{
          color: colors.foreground,
          fontSize: tokens.typography.sizes.lg,
          lineHeight: tokens.typography.lineHeights.lg,
          fontWeight: tokens.typography.weights.semibold,
          textAlign: "center",
        }}>
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
            textAlign: "center",
            marginTop: tokens.spacing.sm,
          }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: tokens.spacing.md }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

type ErrorStateProps = Omit<BaseStateProps, "title"> & {
  title?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description,
  retryLabel = "Try again",
  onRetry,
  style,
  ...props
}: ErrorStateProps) {
  const { colors, tokens } = useTheme();
  const showRetry = Boolean(onRetry);

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: tokens.spacing.xl,
          paddingHorizontal: tokens.spacing.lg,
        },
        style,
      ]}
      {...props}>
      <Text
        style={{
          color: colors.destructive,
          fontSize: tokens.typography.sizes.lg,
          lineHeight: tokens.typography.lineHeights.lg,
          fontWeight: tokens.typography.weights.semibold,
          textAlign: "center",
        }}>
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
            textAlign: "center",
            marginTop: tokens.spacing.sm,
          }}>
          {description}
        </Text>
      ) : null}
      {showRetry ? (
        <View style={{ marginTop: tokens.spacing.md }}>
          <Button label={retryLabel} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

type LoadingStateProps = ViewProps & {
  label?: string;
};

export function LoadingState({ label = "Loading...", style, ...props }: LoadingStateProps) {
  const { colors, tokens } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: tokens.spacing.xl,
          paddingHorizontal: tokens.spacing.lg,
        },
        style,
      ]}
      {...props}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
            marginTop: tokens.spacing.sm,
          }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

type SkeletonProps = ViewProps & {
  variant?: SkeletonVariant;
  height?: number;
  width?: DimensionValue;
  radius?: number;
};

export function Skeleton({
  variant,
  height = 12,
  width = 100,
  radius,
  style,
  ...props
}: SkeletonProps) {
  const { colors, tokens } = useTheme();
  const reduceMotion = useReducedMotion();
  const preset = variant ? skeletonPresets[variant] : null;
  const resolvedHeight = preset?.height ?? height;
  const resolvedWidth: DimensionValue = preset?.width ?? width;
  const resolvedRadius = preset?.radius ?? radius ?? tokens.radius.sm;

  const baseStyle = [
    {
      height: resolvedHeight,
      width: resolvedWidth,
      borderRadius: resolvedRadius,
      backgroundColor: colors.muted,
    },
    style,
  ];

  if (reduceMotion) {
    return <View style={baseStyle} {...props} />;
  }

  return (
    <MotiView
      style={baseStyle}
      from={{ opacity: 0.35 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 900, loop: true, repeatReverse: true }}
      {...props}
    />
  );
}

export type SkeletonVariant = "list" | "card" | "avatar" | "text";

export const skeletonPresets: Record<
  SkeletonVariant,
  { height: number; width: DimensionValue; radius?: number }
> = {
  list: { height: 14, width: "100%" },
  card: { height: 160, width: "100%", radius: 16 },
  avatar: { height: 48, width: 48, radius: 24 },
  text: { height: 12, width: "80%" },
};
