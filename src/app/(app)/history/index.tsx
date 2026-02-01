import { Stack, router, useFocusEffect } from "expo-router";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, H3, P, Pressable, View } from "@/components/ui";
import { useCallback, useMemo, useState } from "react";
import {
  formatWeekRange,
  getRotationType,
  getWeekRange,
  startOfWeekMonday,
  useActivePlan,
} from "@/features/planner/";
import { useTheme } from "@/lib/theme-context";
import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Minus,
  X,
} from "lucide-react-native";
import { ErrorState, LoadingState } from "@/components/feedback-states";
import { PlannerMonthCalendar } from "@/components/planner-month-calendar";
import { ScrollView } from "moti";
import { useHistoryWeek } from "@/hooks/use-history-week";

function formatVolumeKg(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })} kg`;
}

function formatDuration(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  return `${value} mins`;
}

export default function History() {
  const [viewedWeekStart, setViewedWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const [viewedMonthStart, setViewedMonthStart] = useState(() =>
    startOfMonth(new Date())
  );
  const { state, error, refetch } = useActivePlan();
  const { colors, tokens } = useTheme();

  const plan = state.kind === "week_view" ? state.plan : null;
  const {
    loading: isHistoryLoading,
    error: historyError,
    data: historyData,
  } = useHistoryWeek(plan, viewedWeekStart);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [weekStartDate, weekEndDate] = useMemo(
    () => getWeekRange(viewedWeekStart),
    [viewedWeekStart]
  );

  const weekData = historyData?.weekData ?? null;
  const weekStats = historyData?.weekStats;

  const todayMonthStart = useMemo(() => startOfMonth(new Date()), []);
  const nextMonthStart = useMemo(
    () => startOfMonth(addMonths(viewedMonthStart, 1)),
    [viewedMonthStart]
  );
  const canGoToNextMonth =
    nextMonthStart.getTime() <= todayMonthStart.getTime();

  const handlePrevMonth = useCallback(() => {
    const targetMonthStart = startOfMonth(subMonths(viewedMonthStart, 1));
    const today = new Date();
    if (isSameMonth(targetMonthStart, today)) {
      setViewedWeekStart(startOfWeekMonday(today));
      setViewedMonthStart(startOfMonth(today));
    } else {
      setViewedMonthStart(targetMonthStart);
      setViewedWeekStart(startOfWeekMonday(targetMonthStart));
    }
  }, [viewedMonthStart]);

  const handleNextMonth = useCallback(() => {
    if (!canGoToNextMonth) return;
    const targetMonthStart = startOfMonth(addMonths(viewedMonthStart, 1));
    const today = new Date();
    if (isSameMonth(targetMonthStart, today)) {
      setViewedWeekStart(startOfWeekMonday(today));
      setViewedMonthStart(startOfMonth(today));
    } else {
      setViewedMonthStart(targetMonthStart);
      setViewedWeekStart(startOfWeekMonday(targetMonthStart));
    }
  }, [viewedMonthStart, canGoToNextMonth]);

  const handleCalendarDayPress = useCallback((date: Date): void => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date.getTime() > today.getTime()) return;
    const weekStart = startOfWeekMonday(date);
    setViewedWeekStart(weekStart);
    setViewedMonthStart(startOfMonth(weekStart));
  }, []);

  const historySessions = useMemo(
    () => historyData?.historySessions ?? [],
    [historyData]
  );

  if (state.kind === "loading") {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "History" })} />
        <AppHeader showBackButton={false} title="History" isMainScreen />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading history..." />
        </View>
      </Screen>
    );
  }

  if (error || historyError) {
    const message = error?.message ?? historyError?.message ?? "Unknown error";
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "History" })} />
        <AppHeader showBackButton={false} title="History" isMainScreen />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState title="Unable to Load History" description={message} />
        </View>
      </Screen>
    );
  }

  if (state.kind === "hard_empty") {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "History" })} />
        <AppHeader showBackButton={false} title="History" isMainScreen />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState
            title="No History Found"
            description="You haven't completed any sessions yet."
          />
        </View>
      </Screen>
    );
  }

  if (state.kind === "needs_rotation") {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "History" })} />
        <AppHeader showBackButton={false} title="History" isMainScreen />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState
            title="No History Found"
            description="You haven't completed any sessions yet. Set a rotation to get started."
          />
          <Button
            label="Set rotation"
            variant="outline"
            className="mt-4"
            onPress={() =>
              router.push({ pathname: "/planner/rotation" } as never)
            }
          />
        </View>
      </Screen>
    );
  }

  if (isHistoryLoading) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "History" })} />
        <AppHeader showBackButton={false} title="History" isMainScreen />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading history..." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "History" })} />
      <AppHeader showBackButton={false} title="History" isMainScreen />
      <View className="flex-1">
        <View
          className="min-h-14 flex-row items-center justify-between px-4"
          key={`week-nav-${viewedWeekStart.getTime()}`}
        >
          <Pressable
            onPress={handlePrevMonth}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
            }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>

          <View className="flex-1 items-center">
            <View className="flex-row items-center">
              <View className="flex-1 items-center justify-center">
                <P
                  style={{
                    fontSize: tokens.typography.sizes.md,
                    color: colors.mutedForeground,
                    fontWeight: tokens.typography.weights.medium,
                  }}
                >
                  {format(viewedMonthStart, "MMMM yyyy")}
                </P>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleNextMonth}
            disabled={!canGoToNextMonth}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
              opacity: canGoToNextMonth ? 1 : 0.5,
            }}
          >
            <ChevronRight size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View>
          <PlannerMonthCalendar
            monthDate={viewedMonthStart}
            rangeStart={weekStartDate}
            rangeEnd={weekEndDate}
            onDayPress={handleCalendarDayPress}
          />
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col" style={{ marginTop: tokens.spacing.xl }}>
            {weekData &&
            getRotationType(state.plan.cycle.rotation) === "ALTERNATE_AB" ? (
              <H3>
                Week {weekData.variantKey} • {state.plan.split.name}
              </H3>
            ) : (
              <H3>{state.plan.split.name}</H3>
            )}
            <P style={{ color: colors.mutedForeground }}>
              {formatWeekRange(weekStartDate, weekEndDate)}
            </P>
            <View
              className="h-0.5"
              style={{ backgroundColor: `${colors.border}60` }}
            />
          </View>
          <View className="flex-col p-3">
            <P style={{ color: colors.mutedForeground }}>
              {weekStats?.completedCount ?? 0} / {weekStats?.totalPlanned ?? 0}{" "}
              sessions done
            </P>
            <View
              className="flex-row items-center"
              style={{ gap: tokens.spacing.xs }}
            >
              <Dumbbell size={14} color={colors.primary} className="mr-2" />
              <P style={{ color: colors.mutedForeground }}>Total Volume:</P>
              <P
                style={{
                  color: colors.primary,
                  fontWeight: tokens.typography.weights.medium,
                }}
              >
                {formatVolumeKg(weekStats?.totalVolumeKg)}
              </P>
            </View>
            <View
              className="flex-row items-center"
              style={{ gap: tokens.spacing.xs }}
            >
              <Clock size={14} color={colors.foreground} className="mr-2" />
              <P style={{ color: colors.mutedForeground }}>Avg Duration:</P>
              <P
                style={{
                  color: colors.foreground,
                  fontWeight: tokens.typography.weights.medium,
                }}
              >
                {formatDuration(weekStats?.averageDurationMins)}
              </P>
            </View>
            <View
              className="flex-1 flex-col"
              style={{
                gap: tokens.spacing.sm,
                paddingVertical: tokens.spacing.sm,
              }}
            >
              {historySessions.map((session) => (
                <Pressable
                  key={session.plannedSessionTemplateId}
                  onPress={() => {
                    if (!session.completedSessionId) return;
                    router.push({
                      pathname: `/history/${session.completedSessionId}`,
                    } as never);
                  }}
                  className="flex-col"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: tokens.radius.md,
                    paddingHorizontal: tokens.spacing.md,
                  }}
                >
                  <View className="flex-1 flex-row items-center justify-between py-1">
                    <View
                      className="flex-row items-center"
                      style={{ gap: tokens.spacing.md }}
                    >
                      <View
                        className="size-4 rounded-full"
                        style={{
                          backgroundColor:
                            session.status === "completed"
                              ? colors.primary
                              : session.status === "missed"
                                ? colors.destructive
                                : colors.border,
                        }}
                      />
                      <P
                        style={{
                          color: colors.foreground,
                          fontWeight: tokens.typography.weights.medium,
                          fontSize: tokens.typography.sizes.lg,
                        }}
                      >
                        {session.title}
                      </P>
                      <View
                        className="flex-row items-center"
                        style={{ gap: tokens.spacing.sm }}
                      >
                        <View
                          className="size-4 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              session.status === "completed"
                                ? colors.primary
                                : session.status === "missed"
                                  ? colors.destructive
                                  : colors.border,
                          }}
                        >
                          {session.status === "completed" ? (
                            <Check
                              size={12}
                              strokeWidth={4}
                              color={colors.primaryForeground}
                            />
                          ) : session.status === "missed" ? (
                            <X
                              size={12}
                              strokeWidth={4}
                              color={colors.destructiveForeground}
                            />
                          ) : (
                            <Minus
                              size={12}
                              strokeWidth={4}
                              color={colors.mutedForeground}
                            />
                          )}
                        </View>
                        <P
                          style={{
                            color: colors.mutedForeground,
                            fontSize: tokens.typography.sizes.sm,
                          }}
                        >
                          {session.status === "completed"
                            ? "Completed"
                            : session.status === "missed"
                              ? "Missed"
                              : "Planned"}
                        </P>
                      </View>
                    </View>
                    <View
                      className="flex-row items-center"
                      style={{ gap: tokens.spacing.xs }}
                    >
                      <P style={{ color: colors.mutedForeground }}>
                        {formatVolumeKg(session.totalVolumeKg)}
                      </P>
                      <ChevronRight size={16} color={colors.primary} />
                    </View>
                  </View>
                  <View
                    className="flex-1 flex-row items-center border-l-2"
                    style={{
                      borderColor: colors.border,
                      paddingHorizontal: tokens.spacing.md,
                      margin: tokens.spacing.xs,
                      marginBottom: tokens.spacing.md,
                    }}
                  >
                    <P style={{ color: colors.mutedForeground }}>
                      {session.totalSets ?? 0} sets • {session.totalReps ?? 0}{" "}
                      reps
                    </P>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
