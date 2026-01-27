import React, { useEffect } from "react";
import { Screen } from "@/components/screen";
import { Button, Card, H1, H2, P, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { Stack, useRouter } from "expo-router";
import { cn } from "@/lib/cn";
import { ChevronRight } from "lucide-react-native";
import { BackgroundGradient } from "@/components/background-gradient";
import { DEFAULT_WORKOUT_EXERCISES, getExerciseById } from "@/lib/default-workout";
import { formatElapsedMs } from "@/lib/format-elapsed";
import { setStorageItem, STORAGE_KEYS, useStorageState } from "@/lib/storage";
import { SESSION_PHASES } from "@/types/workout-session";

export default function Workout(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const router = useRouter();
  const [[loading, session], setSession] = useStorageState(STORAGE_KEYS.workoutSession);

  useEffect(() => {
    if (loading) return;
    if (!session || session.phase === SESSION_PHASES.idle) {
      const first = DEFAULT_WORKOUT_EXERCISES[0];
      if (first) {
        setSession({
          phase: SESSION_PHASES.inWorkout,
          startedAt: Date.now(),
          currentExerciseId: first.id,
          currentSetNumber: 1,
        });
      }
    }
  }, [loading, session, setSession]);

  const currentExercise = session
    ? getExerciseById(DEFAULT_WORKOUT_EXERCISES, session.currentExerciseId)
    : undefined;
  const exerciseName = currentExercise?.name ?? "—";
  const setsTotal = currentExercise?.sets ?? 0;
  const [elapsedMs, setElapsedMs] = React.useState(() =>
    session ? Date.now() - session.startedAt : 0
  );
  useEffect(() => {
    if (!session) return;
    setElapsedMs(Date.now() - session.startedAt);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - session.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  function handleContinue(): void {
    if (!session) return;
    const exercise = getExerciseById(DEFAULT_WORKOUT_EXERCISES, session.currentExerciseId);
    if (!exercise) {
      const first = DEFAULT_WORKOUT_EXERCISES[0];
      if (first) {
        setSession({
          ...session,
          currentExerciseId: first.id,
          currentSetNumber: 1,
        });
      }
      return;
    }
    if (session.currentSetNumber < exercise.sets) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        currentSetNumber: session.currentSetNumber + 1,
      });
      return;
    }
    const currentIndex = DEFAULT_WORKOUT_EXERCISES.findIndex(
      (e) => e.id === session.currentExerciseId
    );
    const next = DEFAULT_WORKOUT_EXERCISES[currentIndex + 1];
    if (next) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        currentExerciseId: next.id,
        currentSetNumber: 1,
      });
    } else {
      setSession({ ...session, phase: SESSION_PHASES.completed });
    }
  }

  const isCompleted = session?.phase === SESSION_PHASES.completed;

  function handleFinish(): void {
    if (!session) return;
    const completedSession = {
      ...session,
      phase: SESSION_PHASES.completed,
      startedAt: session.startedAt ?? Date.now(),
      currentExerciseId: session.currentExerciseId ?? DEFAULT_WORKOUT_EXERCISES[0]?.id ?? "",
      currentSetNumber: session.currentSetNumber ?? 1,
    };
    setStorageItem(STORAGE_KEYS.workoutSession, completedSession);
    setSession(completedSession);
    router.dismissAll();
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
        }}
      />
      <Screen
        preset="modal"
        background="gradient"
        safeAreaEdges={["bottom"]}
        contentContainerClassName="flex-1 px-4 pt-8">
        <BackgroundGradient />
        <View>
          <H2 style={{ color: colors.primary }}>Workout</H2>
          <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
            {formatElapsedMs(elapsedMs)} elapsed
          </P>
        </View>
        <View className="mt-12">
          <H1>{exerciseName}</H1>
          <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>
            Set {session?.currentSetNumber ?? 1} of {setsTotal || 1}
          </P>
        </View>
        <View className="flex-1">
          <Card className="mt-16" style={{ padding: 0 }}>
            {DEFAULT_WORKOUT_EXERCISES.map((item, index) => {
              const isActive = session?.currentExerciseId === item.id;
              return (
                <View
                  key={item.id}
                  className={cn(
                    "flex-row items-center justify-normal gap-6 p-4",
                    index === 0 && "rounded-t-lg",
                    index === DEFAULT_WORKOUT_EXERCISES.length - 1 && "rounded-b-lg",
                    index !== 0 && "border-t"
                  )}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}>
                  {isActive ? (
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
                    }}>
                    {item.name}
                  </Text>
                  <View className="flex-1 flex-row items-center justify-end gap-2">
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        opacity: 0.8,
                        fontSize: tokens.typography.sizes.sm,
                      }}>
                      {item.sets} sets
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        opacity: 0.8,
                        fontSize: tokens.typography.sizes.sm,
                      }}>
                      {item.reps} reps
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        opacity: 0.8,
                        fontSize: tokens.typography.sizes.sm,
                      }}>
                      {item.weight} lbs
                    </Text>
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
        <View className="mb-4 border-t-2 py-4" style={{ borderColor: colors.border }}>
          {isCompleted ? (
            <Button
              label="Done"
              variant="primary"
              size="lg"
              onPress={() => {
                setSession(null);
                router.back();
              }}
              accessibilityLabel="Done, clear session"
            />
          ) : (
            <Button
              label="Continue"
              variant="primary"
              size="lg"
              icon={
                <ChevronRight size={24} className="mt-[0.25px]" color={colors.primaryForeground} />
              }
              iconPlacement="right"
              onPress={handleContinue}
            />
          )}
          <Button label="Finish workout" variant="link" onPress={handleFinish} />
        </View>
      </Screen>
    </>
  );
}
