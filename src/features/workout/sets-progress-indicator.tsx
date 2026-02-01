import React from "react";
import { View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type SetsProgressIndicatorProps = {
  completed: number;
  total: number;
};

const TRACK_HEIGHT = 3;
const DOT_SIZE = 10;

export function SetsProgressIndicator({
  completed,
  total,
}: SetsProgressIndicatorProps): React.ReactElement {
  const { colors } = useTheme();

  if (total <= 0) return <View />;

  const clampedCompleted = Math.min(Math.max(0, completed), total);
  const fillPercent =
    total > 1 && clampedCompleted >= 1
      ? ((clampedCompleted - 1) / (total - 1)) * 100
      : clampedCompleted >= total
        ? 100
        : 0;

  return (
    <View
      className="mx-auto w-1/2 flex-row items-center justify-center"
      style={{ paddingVertical: 12 }}
    >
      <View
        className="flex-1 flex-row items-center justify-end gap-8"
        style={{ position: "relative" }}
      >
        {/* Track background */}
        <View
          className="absolute rounded-full"
          style={{
            left: 0,
            right: 0,
            height: TRACK_HEIGHT,
            top: (DOT_SIZE - TRACK_HEIGHT) / 2,
            backgroundColor: colors.mutedForeground,
            opacity: 0.35,
          }}
        />
        {/* Track fill (completed segment) */}
        <View
          className="absolute rounded-full"
          style={{
            left: 0,
            right: 0,
            width: `${fillPercent + DOT_SIZE}%`,
            height: TRACK_HEIGHT,
            top: (DOT_SIZE - TRACK_HEIGHT) / 2,
            backgroundColor: colors.primary,
          }}
        />
        {/* Dots */}
        {Array.from({ length: total }, (_, i) => {
          const isFilled = i < clampedCompleted;
          return (
            <View
              key={i}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                backgroundColor: isFilled ? colors.primary : colors.background,
                borderWidth: isFilled ? 0 : 2,
                borderColor: colors.mutedForeground,
                opacity: isFilled ? 1 : 0.5,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
