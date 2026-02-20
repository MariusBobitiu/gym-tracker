import React from "react";
import { Button, H2, P, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { formatElapsedMs } from "@/lib/format-elapsed";

type WorkoutHeaderProps = {
  elapsedMs: number;
  onFinish: () => void;
};

export function WorkoutHeader({
  elapsedMs,
  onFinish,
}: WorkoutHeaderProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View className="w-full flex-row items-start justify-between">
      <View>
        <H2 style={{ color: colors.primary }}>Workout</H2>
        <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
          {formatElapsedMs(elapsedMs)} elapsed
        </P>
      </View>
      <Button
        label="Done"
        variant="outline"
        onPress={onFinish}
        accessibilityLabel="Done, clear session"
      />
    </View>
  );
}
