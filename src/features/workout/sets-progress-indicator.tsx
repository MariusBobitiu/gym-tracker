import React from "react";
import { View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type SetsProgressIndicatorProps = {
  completed: number;
  total: number;
};

const TRACK_HEIGHT = 3;
const DOT_SIZE = 10;
const MAX_DOTS_FOR_WIDE_GAP = 6;
const GAP_WIDE = 12;
const GAP_NARROW = 6;

export function SetsProgressIndicator({
  completed,
  total,
}: SetsProgressIndicatorProps): React.ReactElement {
  const { colors } = useTheme();

  if (total <= 0) return <View />;

  const clampedCompleted = Math.min(Math.max(0, completed), total);
  const gap = total > MAX_DOTS_FOR_WIDE_GAP ? GAP_NARROW : GAP_WIDE;

  const trackWidth = total > 1 ? (total - 1) * (DOT_SIZE + gap) : 0;
  const fillWidth =
    total > 1 && clampedCompleted >= 1
      ? (clampedCompleted - 1) * (DOT_SIZE + gap)
      : 0;

  return (
    <View
      className="flex-row items-center justify-center"
      style={{ paddingVertical: 12, paddingHorizontal: 8 }}
    >
      <View
        className="flex-row items-center justify-center"
        style={{
          position: "relative",
          gap,
        }}
      >
        {/* Track background: between first and last dot centers */}
        <View
          className="absolute rounded-full"
          style={{
            left: DOT_SIZE / 2,
            width: trackWidth,
            height: TRACK_HEIGHT,
            top: (DOT_SIZE - TRACK_HEIGHT) / 2,
            backgroundColor: colors.mutedForeground,
            opacity: 0.35,
          }}
        />
        {/* Track fill: from first dot to last completed dot */}
        {fillWidth > 0 && (
          <View
            className="absolute rounded-full"
            style={{
              left: DOT_SIZE / 2,
              width: fillWidth,
              height: TRACK_HEIGHT,
              top: (DOT_SIZE - TRACK_HEIGHT) / 2,
              backgroundColor: colors.primary,
            }}
          />
        )}
        {/* Dots: one row, no wrap */}
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
