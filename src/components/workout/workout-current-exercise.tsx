import React from "react";
import { H1, P, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type WorkoutCurrentExerciseProps = {
  exerciseName: string;
  currentSetNumber: number;
  setsTotal: number;
};

export function WorkoutCurrentExercise({
  exerciseName,
  currentSetNumber,
  setsTotal,
}: WorkoutCurrentExerciseProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View className="mt-12">
      <H1 style={{ color: colors.foreground }}>{exerciseName}</H1>
      <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
        Set {currentSetNumber} of {setsTotal || 1}
      </P>
    </View>
  );
}
