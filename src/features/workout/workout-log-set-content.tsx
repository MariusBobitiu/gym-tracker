import React, { useEffect, useState } from "react";
import { Button, Card, H1, P, View } from "@/components/ui";
import { SetInputStepper } from "@/features/workout";
import { useWeightUnit } from "@/hooks/use-weight-unit";
import { DEFAULT_WEIGHT_KG } from "@/lib/default-workout";
import { useTheme } from "@/lib/theme-context";
import type { PlanExercise } from "@/types/workout-session";
import { Check } from "lucide-react-native";

const WEIGHT_MIN = 0;
const WEIGHT_MAX = 500;
const WEIGHT_STEP = 1;
const REPS_MIN = 1;
const REPS_MAX = 999;

type WorkoutLogSetContentProps = {
  exerciseName: string;
  setsTotal: number;
  currentSetNumber: number;
  currentExercise: PlanExercise;
  onComplete: (weight: number, reps: number) => void;
  clearAndBack: () => void;
  /** Suggested weight (last exercise > last same workout > default). */
  initialWeight?: number;
  /** Suggested reps (last exercise > last same workout > default). */
  initialReps?: number;
};

export function WorkoutLogSetContent({
  exerciseName,
  setsTotal,
  currentSetNumber,
  currentExercise,
  onComplete,
  clearAndBack,
  initialWeight,
  initialReps,
}: WorkoutLogSetContentProps): React.ReactElement {
  const { colors } = useTheme();
  const { fromKg, toKg, weightUnitLabel } = useWeightUnit();
  const defaultWeightKg =
    initialWeight ?? currentExercise?.weight ?? DEFAULT_WEIGHT_KG;
  const defaultWeightDisplay = fromKg(defaultWeightKg);
  const defaultReps = initialReps ?? currentExercise?.reps ?? 10;
  const [weight, setWeight] = useState(defaultWeightDisplay);
  const [reps, setReps] = useState(defaultReps);

  useEffect(() => {
    setWeight(defaultWeightDisplay);
    setReps(defaultReps);
  }, [
    defaultWeightDisplay,
    defaultReps,
    currentSetNumber,
    currentExercise?.id,
  ]);

  return (
    <>
      <View>
        <H1 style={{ color: colors.foreground }}>{exerciseName}</H1>
        <P style={{ color: colors.mutedForeground, marginTop: 4 }}>
          Set {currentSetNumber} of {setsTotal || 1}
        </P>
        <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
          Target: {currentExercise.reps} reps
        </P>
      </View>
      <View className="mt-6 flex-1">
        <Card className="p-5" style={{ backgroundColor: colors.muted }}>
          <View className="mb-2 flex-row items-center justify-between">
            <P
              style={{
                color: colors.foreground,
                fontWeight: "600",
                letterSpacing: 1,
              }}
            >
              WEIGHT
            </P>
            <P
              style={{
                color: colors.mutedForeground,
                fontSize: 14,
                marginBottom: 2,
              }}
            >
              {weightUnitLabel}
            </P>
          </View>
          <View className="mb-6 items-center py-6">
            <SetInputStepper
              value={weight}
              onChange={setWeight}
              min={WEIGHT_MIN}
              max={WEIGHT_MAX}
              step={WEIGHT_STEP}
              // unit={weightUnitLabel}
              pickerTitle={`Weight (${weightUnitLabel})`}
            />
          </View>
        </Card>

        <Card className="mt-4 p-5" style={{ backgroundColor: colors.muted }}>
          <P
            className="mb-2"
            style={{
              color: colors.foreground,
              fontWeight: "600",
              letterSpacing: 1,
            }}
          >
            REPS
          </P>
          <View className="mb-6 items-center py-6">
            <SetInputStepper
              value={reps}
              onChange={setReps}
              min={REPS_MIN}
              max={REPS_MAX}
              step={1}
              pickerTitle="Reps"
            />
          </View>
        </Card>
      </View>

      <View>
        <Button
          label="Complete set"
          variant="primary"
          size="lg"
          icon={
            <Check
              size={24}
              color={colors.primaryForeground}
              className="mr-2"
            />
          }
          iconPlacement="left"
          onPress={() => onComplete(toKg(weight), reps)}
          accessibilityLabel="Complete set"
        />
        <Button label="Go back" variant="link" onPress={() => clearAndBack()} />
      </View>
    </>
  );
}
