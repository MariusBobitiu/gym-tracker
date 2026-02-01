import * as React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Link, Stack } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Button, Text, View } from "@/components/ui";
import AppHeader from "@/components/app-header";
import { Screen } from "@/components/screen";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth/context";
import {
  AmbientBackground,
  NoiseOverlay,
} from "@/components/ambient-background";
import {
  DEFAULT_WORKOUT_EXERCISES,
  getExerciseById,
} from "@/lib/default-workout";
import { formatElapsedMs } from "@/lib/format-elapsed";
import { getStorageItem, STORAGE_KEYS, useStorageState } from "@/lib/storage";
import type { WorkoutSession } from "@/types/workout-session";
import { SESSION_PHASES } from "@/types/workout-session";

type WeekDot = {
  id: string;
  label: string;
  isActive?: boolean;
  isToday?: boolean;
};

const WEEK_DOTS: WeekDot[] = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T", isActive: true },
  { id: "wed", label: "W", isActive: true },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" },
];

const workoutsThisWeek = 4;

function WeekSummary(): React.ReactElement {
  const { colors, tokens, isDark } = useTheme();
  const completedCount = WEEK_DOTS.filter((dot) => dot.isActive).length;
  const progressPercentage = (completedCount / workoutsThisWeek) * 100;
  const today = new Date()
    .toLocaleDateString("en-GB", { weekday: "short" })
    .toLowerCase();
  const todayDot = WEEK_DOTS.find((dot) => dot.id === today);
  if (todayDot) {
    // todayDot.isActive = true;
    todayDot.isToday = true;
  }

  return (
    <View className="mt-12">
      <View className="mb-4 flex-row items-center justify-between">
        <Text
          className="uppercase tracking-[2px]"
          style={{ color: colors.mutedForeground }}
        >
          This week
        </Text>
        <Text
          style={{
            fontSize: tokens.typography.sizes.xs,
            color: colors.mutedForeground,
            opacity: 0.6,
          }}
        >
          {completedCount}/{WEEK_DOTS.length}
        </Text>
      </View>

      {/* Week dots with labels */}
      <View className="mb-4 flex-row items-center justify-between">
        {WEEK_DOTS.map((dot) => (
          <View key={dot.id} className="items-center gap-1.5">
            <View
              className="size-3 rounded-full"
              style={{
                backgroundColor: dot.isActive
                  ? colors.primary
                  : dot.isToday
                    ? colors.foreground
                    : isDark
                      ? colors.border
                      : colors.foreground,
                opacity: dot.isActive
                  ? 1
                  : dot.isToday
                    ? 0.45
                    : isDark
                      ? 0.6
                      : 0.15,
              }}
            />
            <Text
              className="text-[10px] font-medium"
              style={{
                color: dot.isActive
                  ? colors.foreground
                  : dot.isToday
                    ? colors.foreground
                    : colors.mutedForeground,
                opacity: dot.isActive ? 1 : dot.isToday ? 0.6 : 0.6,
              }}
            >
              {dot.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Subtle progress bar */}
      <View
        className="mb-3 h-[0.75px] overflow-hidden rounded-full"
        style={{ backgroundColor: colors.border, opacity: 0.8 }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: colors.primary,
            opacity: 1,
          }}
        />
      </View>

      {/* Stats */}
      <View className="flex-row items-center gap-3">
        <Text
          className="text-xs font-medium"
          style={{
            color: colors.mutedForeground,
            opacity: 0.8,
          }}
        >
          2 sessions
        </Text>
        <View
          className="size-1 rounded-full"
          style={{ backgroundColor: colors.mutedForeground, opacity: 0.5 }}
        />
        <Text
          className="text-xs font-medium"
          style={{
            color: colors.mutedForeground,
            opacity: 0.8,
          }}
        >
          120 min
        </Text>
        <View
          className="size-1 rounded-full"
          style={{ backgroundColor: colors.mutedForeground, opacity: 0.5 }}
        />
        <Text
          className="text-xs font-medium"
          style={{
            color: colors.mutedForeground,
            opacity: 0.8,
          }}
        >
          12.4k kg
        </Text>
      </View>
    </View>
  );
}

function ReadyToTrainCard(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View
      className="mb-4 rounded-3xl border p-6"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Text
        className="uppercase tracking-[2px]"
        style={{ color: colors.mutedForeground }}
      >
        Ready to train
      </Text>
      <Text
        className="font-inter mt-3 font-semibold"
        style={{ fontSize: 28, lineHeight: 32, color: colors.foreground }}
      >
        Pull
      </Text>
      <Text
        className="mt-1 text-base"
        style={{ color: colors.mutedForeground }}
      >
        Back & biceps
      </Text>
      <Link href="/workout" asChild>
        <Button
          label="Start workout"
          icon={<ChevronRight size={18} color={colors.primaryForeground} />}
          iconPlacement="right"
          className="mt-6"
          variant="primary"
          size="lg"
          textClassName="font-semibold"
          accessibilityLabel="Start workout"
        />
      </Link>
    </View>
  );
}

function ActiveSessionCard({
  session,
}: {
  session: WorkoutSession;
}): React.ReactElement {
  const { colors } = useTheme();
  const [elapsedMs, setElapsedMs] = React.useState(
    () => Date.now() - session.startedAt
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - session.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const exercise = getExerciseById(
    DEFAULT_WORKOUT_EXERCISES,
    session.currentExerciseId
  );
  const exerciseName = exercise?.name ?? "Unknown exercise";
  const setsTotal = exercise?.sets ?? 0;
  const setLabel =
    setsTotal > 0
      ? `Set ${session.currentSetNumber} of ${setsTotal}`
      : `Set ${session.currentSetNumber}`;

  return (
    <View
      className="mb-4 rounded-3xl border p-6"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Text
        className="uppercase tracking-[2px]"
        style={{ color: colors.mutedForeground }}
      >
        Workout in progress
      </Text>
      <Text
        className="font-inter mt-3 font-semibold"
        style={{ fontSize: 28, lineHeight: 32, color: colors.foreground }}
      >
        {formatElapsedMs(elapsedMs)} elapsed
      </Text>
      <Text
        className="mt-1 text-base"
        style={{ color: colors.mutedForeground }}
      >
        {exerciseName} · {setLabel}
      </Text>
      <Link href="/workout" asChild>
        <Button
          label="Resume workout"
          icon={<ChevronRight size={18} color={colors.primaryForeground} />}
          iconPlacement="right"
          className="mt-6"
          variant="primary"
          size="lg"
          textClassName="font-semibold"
          accessibilityLabel="Resume workout"
        />
      </Link>
    </View>
  );
}

function CompletedSessionCard({
  session,
  onDone,
}: {
  session: WorkoutSession;
  onDone: () => void;
}): React.ReactElement {
  const { colors } = useTheme();
  const totalMs = Date.now() - session.startedAt;

  return (
    <View
      className="mb-4 rounded-3xl border p-6"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Text
        className="uppercase tracking-[2px]"
        style={{ color: colors.mutedForeground }}
      >
        Session complete
      </Text>
      <Text
        className="font-inter mt-3 font-semibold"
        style={{ fontSize: 28, lineHeight: 32, color: colors.foreground }}
      >
        {formatElapsedMs(totalMs)} total
      </Text>
      <Text
        className="mt-1 text-base"
        style={{ color: colors.mutedForeground }}
      >
        Great work. Tap Done to start a new session later.
      </Text>
      <Button
        label="Done"
        variant="primary"
        size="lg"
        className="mt-6"
        onPress={onDone}
        accessibilityLabel="Done, clear session"
      />
    </View>
  );
}

function renderMainCard(
  session: WorkoutSession | null,
  setSession: (value: WorkoutSession | null) => void
): React.ReactElement {
  if (!session || session.phase === SESSION_PHASES.idle) {
    return <ReadyToTrainCard />;
  }
  if (
    session.phase === SESSION_PHASES.inWorkout ||
    session.phase === SESSION_PHASES.inExercise ||
    session.phase === SESSION_PHASES.resting
  ) {
    return <ActiveSessionCard session={session} />;
  }
  if (session.phase === SESSION_PHASES.completed) {
    return (
      <CompletedSessionCard session={session} onDone={() => setSession(null)} />
    );
  }
  return <ReadyToTrainCard />;
}

export default function Home(): React.ReactElement {
  const { user } = useAuth();
  const [[, session], setSession] = useStorageState(
    STORAGE_KEYS.workoutSession
  );

  useFocusEffect(
    React.useCallback(() => {
      const value = getStorageItem(STORAGE_KEYS.workoutSession);
      setSession(value ?? null);
    }, [setSession])
  );

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
    const userName = user?.name?.split(" ")[0] || "there";
    return `${timeGreeting}, ${userName}`;
  }, [user?.name]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        <AmbientBackground />
        <NoiseOverlay />
        <Screen
          preset="scroll"
          safeAreaEdges={["top"]}
          contentContainerClassName="pb-28 pt-4"
          background="none"
        >
          <AppHeader showBackButton={false} title={greeting} isMainScreen />
          <View className="mt-4 flex-1">
            <WeekSummary />
          </View>
          <Animated.View
            key={
              !session || session.phase === SESSION_PHASES.idle
                ? "idle"
                : session.phase
            }
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
          >
            {renderMainCard(session, setSession)}
          </Animated.View>
        </Screen>
      </View>
    </>
  );
}
