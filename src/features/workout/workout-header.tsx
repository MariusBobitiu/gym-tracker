import React from "react";
import { H2, P, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { formatElapsedMs } from "@/lib/format-elapsed";

type WorkoutHeaderProps = {
  elapsedMs: number;
};

export function WorkoutHeader({
  elapsedMs,
}: WorkoutHeaderProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View>
      <H2 style={{ color: colors.primary }}>Workout</H2>
      <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
        {formatElapsedMs(elapsedMs)} elapsed
      </P>
    </View>
  );
}
