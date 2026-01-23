import type { Insets } from "react-native";

export const DEFAULT_HIT_SLOP = 10;

export function getHitSlop(value: number = DEFAULT_HIT_SLOP): Insets {
  return {
    top: value,
    right: value,
    bottom: value,
    left: value,
  };
}

export function resolveAccessibilityLabel(options: {
  label?: string;
  accessibilityLabel?: string;
  fallback?: string;
}) {
  return options.accessibilityLabel ?? options.label ?? options.fallback;
}
