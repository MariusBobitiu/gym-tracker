import * as React from "react";
import { useCallback, useMemo, useState } from "react";
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
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  useStorageState,
} from "@/lib/storage";
import type {
  WorkoutSession,
  WorkoutSessionUIState,
} from "@/types/workout-session";
import { SESSION_PHASES } from "@/types/workout-session";
import {
  deleteActiveWorkoutSession,
  getUpNextSession,
} from "@/features/planner/planner-repository";
import { startOfWeekMonday } from "@/features/planner/date-utils";
import { useActivePlan } from "@/features/planner/use-active-plan";
import { useHistoryWeek } from "@/hooks/use-history-week";
import type { HistorySessionView } from "@/types/history";

type WeekDot = {
  id: string;
  label: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ...
  isActive?: boolean;
  isToday?: boolean;
};

const WEEK_DOTS: WeekDot[] = [
  { id: "mon", label: "M", dayOfWeek: 1 },
  { id: "tue", label: "T", dayOfWeek: 2 },
  { id: "wed", label: "W", dayOfWeek: 3 },
  { id: "thu", label: "T", dayOfWeek: 4 },
  { id: "fri", label: "F", dayOfWeek: 5 },
  { id: "sat", label: "S", dayOfWeek: 6 },
  { id: "sun", label: "S", dayOfWeek: 0 },
];

function formatVolumeKg(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k kg`;
  return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })} kg`;
}

function WeekSummary({
  historySessions,
  weekStats,
  totalPlanned,
}: {
  historySessions: HistorySessionView[];
  weekStats: {
    completedCount: number;
    totalVolumeKg: number;
    averageDurationMins: number | null;
  } | null;
  totalPlanned: number;
}): React.ReactElement {
  const { colors, tokens, isDark } = useTheme();
  const completedDays = useMemo(() => {
    const set = new Set<number>();
    for (const s of historySessions) {
      if (s.status === "completed" && s.completedAt != null) {
        set.add(new Date(s.completedAt).getDay());
      }
    }
    return set;
  }, [historySessions]);
  const todayDay = useMemo(() => new Date().getDay(), []);
  const dotsWithState = useMemo(
    () =>
      WEEK_DOTS.map((dot) => ({
        ...dot,
        isActive: completedDays.has(dot.dayOfWeek),
        isToday: dot.dayOfWeek === todayDay,
      })),
    [completedDays, todayDay]
  );
  const completedCount = weekStats?.completedCount ?? 0;
  const progressPercentage =
    totalPlanned > 0 ? (completedCount / totalPlanned) * 100 : 0;

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
          {completedCount}/{totalPlanned > 0 ? totalPlanned : 7}
        </Text>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        {dotsWithState.map((dot) => (
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

      <View className="flex-row items-center gap-3">
        <Text
          className="text-xs font-medium"
          style={{ color: colors.mutedForeground, opacity: 0.8 }}
        >
          {completedCount} session{completedCount !== 1 ? "s" : ""}
        </Text>
        <View
          className="size-1 rounded-full"
          style={{ backgroundColor: colors.mutedForeground, opacity: 0.5 }}
        />
        <Text
          className="text-xs font-medium"
          style={{ color: colors.mutedForeground, opacity: 0.8 }}
        >
          {weekStats?.averageDurationMins != null
            ? `${weekStats.averageDurationMins} min`
            : "—"}
        </Text>
        <View
          className="size-1 rounded-full"
          style={{ backgroundColor: colors.mutedForeground, opacity: 0.5 }}
        />
        <Text
          className="text-xs font-medium"
          style={{ color: colors.mutedForeground, opacity: 0.8 }}
        >
          {formatVolumeKg(weekStats?.totalVolumeKg)}
        </Text>
      </View>
    </View>
  );
}

type NextSessionInfo = { sessionName: string; sessionId: string } | null;

function ReadyToTrainCard({
  nextSession,
  hasPlan,
}: {
  nextSession: NextSessionInfo;
  hasPlan: boolean;
}): React.ReactElement {
  const { colors } = useTheme();
  const title =
    nextSession?.sessionName ??
    (hasPlan ? "Ready to train" : "Set up your plan");
  const subtitle = nextSession
    ? null
    : hasPlan
      ? "No session selected"
      : "Create a split and rotation to see your next workout";
  const href = nextSession
    ? `/workout/start?plannedSessionId=${encodeURIComponent(nextSession.sessionId)}`
    : "/planner";
  const buttonLabel = nextSession ? "Start workout" : "Go to planner";

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
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-1 text-base"
          style={{ color: colors.mutedForeground }}
        >
          {subtitle}
        </Text>
      ) : null}
      <Link href={href as never} asChild>
        <Button
          label={buttonLabel}
          icon={<ChevronRight size={18} color={colors.primaryForeground} />}
          iconPlacement="right"
          className="mt-6"
          variant="primary"
          size="lg"
          textClassName="font-semibold"
          accessibilityLabel={buttonLabel}
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
  setSession: (value: WorkoutSession | null) => void,
  nextSession: NextSessionInfo,
  hasPlan: boolean
): React.ReactElement {
  if (!session || session.phase === SESSION_PHASES.idle) {
    return <ReadyToTrainCard nextSession={nextSession} hasPlan={hasPlan} />;
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
  return <ReadyToTrainCard nextSession={nextSession} hasPlan={hasPlan} />;
}

/** Build a minimal WorkoutSession for the home card from MMKV UI state (session data lives in SQLite). */
function sessionFromUIState(
  uiState: WorkoutSessionUIState | null
): WorkoutSession | null {
  if (!uiState) return null;
  return {
    phase: uiState.phase,
    startedAt: uiState.startedAt,
    currentExerciseId: uiState.currentExerciseId,
    currentSetNumber: uiState.currentSetNumber,
  };
}

export default function Home(): React.ReactElement {
  const { user } = useAuth();
  const [[, uiState], setUIState] = useStorageState(
    STORAGE_KEYS.workoutSessionUI
  );
  const session = useMemo(() => sessionFromUIState(uiState), [uiState]);
  const clearSession = useCallback(() => {
    if (uiState?.activeSessionId) {
      void deleteActiveWorkoutSession(uiState.activeSessionId);
    }
    setStorageItem(STORAGE_KEYS.workoutSessionUI, null);
    setUIState(null);
  }, [uiState?.activeSessionId, setUIState]);

  const { state: planState, refetch: refetchPlan } = useActivePlan();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const plan = planState.kind === "week_view" ? planState.plan : null;
  const {
    data: historyData,
    loading: isHistoryLoading,
    refetch: refetchHistory,
  } = useHistoryWeek(plan, currentWeekStart);

  useFocusEffect(
    useCallback(() => {
      const value = getStorageItem(STORAGE_KEYS.workoutSessionUI);
      setUIState(value ?? null);
      setCurrentWeekStart(startOfWeekMonday(new Date()));
      refetchPlan();
    }, [setUIState, refetchPlan])
  );

  useFocusEffect(
    useCallback(() => {
      if (plan) void refetchHistory();
    }, [plan, refetchHistory])
  );

  const nextSession = useMemo((): NextSessionInfo => {
    if (!plan) return null;
    const up = getUpNextSession(plan, plan.cycleState);
    return up ? { sessionName: up.sessionName, sessionId: up.sessionId } : null;
  }, [plan]);

  const hasPlan =
    planState.kind === "week_view" ||
    planState.kind === "needs_rotation" ||
    planState.kind === "loading";

  const historySessions = useMemo(
    () => historyData?.historySessions ?? [],
    [historyData]
  );
  const weekStats = historyData?.weekStats ?? null;
  const totalPlanned = historyData?.weekData?.totalPlanned ?? 0;

  const greeting = useMemo(() => {
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

  const showWeekSummary = planState.kind !== "loading";
  const isLoadingCard =
    planState.kind === "loading" ||
    (plan != null && isHistoryLoading && historyData == null);

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
            {showWeekSummary && (
              <WeekSummary
                historySessions={historySessions}
                weekStats={weekStats}
                totalPlanned={totalPlanned}
              />
            )}
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
            {renderMainCard(
              session,
              (value) => {
                if (value === null) clearSession();
              },
              isLoadingCard ? null : nextSession,
              hasPlan
            )}
          </Animated.View>
        </Screen>
      </View>
    </>
  );
}
