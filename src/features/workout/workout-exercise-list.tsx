import React from "react";
import { Card, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/cn";
import { CheckCircle, ChevronRight } from "lucide-react-native";
import type { PlanExercise } from "@/types/workout-session";

type WorkoutExerciseListProps = {
  exercises: PlanExercise[];
  currentExerciseId: string | undefined;
  completedExerciseIds?: string[];
};

export function WorkoutExerciseList({
  exercises,
  currentExerciseId,
  completedExerciseIds = [],
}: WorkoutExerciseListProps): React.ReactElement {
  const { colors, tokens } = useTheme();
  return (
    <View className="flex-1">
      <Card className="mt-16" style={{ padding: 0 }}>
        {exercises.map((item, index) => {
          const isActive = currentExerciseId === item.id;
          const isCompleted = completedExerciseIds.includes(item.id);
          return (
            <View
              key={item.id}
              className={cn(
                "flex-row items-center justify-normal gap-6 p-4",
                index === 0 && "rounded-t-lg",
                index === exercises.length - 1 && "rounded-b-lg",
                index !== 0 && "border-t"
              )}
              style={{
                backgroundColor: isCompleted ? colors.muted : colors.card,
                borderColor: colors.border,
              }}
            >
              {isCompleted ? (
                <CheckCircle size={24} color="#22C55E" />
              ) : isActive ? (
                <View
                  className="size-3 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              ) : (
                <View
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: colors.mutedForeground,
                    opacity: 0.2,
                  }}
                />
              )}
              <Text
                style={{
                  color: colors.foreground,
                  fontWeight: tokens.typography.weights.bold,
                }}
              >
                {item.name}
              </Text>
              <View className="flex-1 flex-row items-center justify-end gap-2">
                <Text
                  style={{
                    color: colors.mutedForeground,
                    opacity: 0.8,
                    fontSize: tokens.typography.sizes.sm,
                  }}
                >
                  {item.sets} sets
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    opacity: 0.8,
                    fontSize: tokens.typography.sizes.sm,
                  }}
                >
                  {item.reps} reps
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    opacity: 0.8,
                    fontSize: tokens.typography.sizes.sm,
                  }}
                >
                  {item.weight} lbs
                </Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}
