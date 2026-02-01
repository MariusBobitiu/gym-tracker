import React, { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarWeeks, format, startOfWeek } from "date-fns";
import { Stack, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Settings2,
} from "lucide-react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  H3,
  P,
  Text,
} from "@/components/ui";
import { Modal, useModal } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme-context";
import {
  formatDateShort,
  formatWeekRange,
  getWeekRange,
  startOfWeekMonday,
} from "@/features/planner/date-utils";
import {
  getWeekSessionsFromPlan,
  getRotationType,
  completePlannedSession,
} from "@/features/planner/planner-repository";
import { useActivePlan } from "@/features/planner/use-active-plan";
import type { PlannedSessionView } from "@/features/planner/planner-types";
import { AnimatePresence, MotiView, ScrollView } from "moti";
import { LoadingState } from "@/components/feedback-states";
import { PlannerMonthCalendar } from "@/components/planner-month-calendar";
import { getHitSlop, resolveAccessibilityLabel } from "@/lib/accessibility";
import { useReducedMotion } from "@/lib/motion";

function PlanPill() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/planner/plan" } as never)}
      hitSlop={getHitSlop()}
    >
      <Settings2 size={28} color={colors.foreground} />
    </Pressable>
  );
}

export default function Planner() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [viewedWeekStart, setViewedWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(0);
  const [selectedSession, setSelectedSession] =
    useState<PlannedSessionView | null>(null);
  const sessionModal = useModal();
  const reduceMotion = useReducedMotion();

  const { state, error, refetch } = useActivePlan();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const thisWeekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const canGoToPrevWeek = viewedWeekStart.getTime() > thisWeekStart.getTime();

  const [weekStartDate, weekEndDate] = useMemo(
    () => getWeekRange(viewedWeekStart),
    [viewedWeekStart]
  );
  const isCurrentWeek = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const viewedStart = startOfWeek(viewedWeekStart, { weekStartsOn: 1 });
    return todayWeekStart.getTime() === viewedStart.getTime();
  }, [viewedWeekStart]);
  const isNextWeek = useMemo(() => {
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return nextWeekStart.getTime() === viewedWeekStart.getTime();
  }, [thisWeekStart, viewedWeekStart]);
  const sessionsHeaderText = useMemo(
    () =>
      isCurrentWeek
        ? "Sessions for this week"
        : `Sessions for ${formatDateShort(weekStartDate)} – ${formatDateShort(weekEndDate)}`,
    [isCurrentWeek, weekStartDate, weekEndDate]
  );
  const weekRangeText = useMemo(
    () => formatWeekRange(weekStartDate, weekEndDate),
    [weekStartDate, weekEndDate]
  );
  const calendarTitleText = useMemo(() => {
    if (!isCalendarOpen) return weekRangeText;
    return format(weekStartDate, "MMMM yyyy");
  }, [isCalendarOpen, weekRangeText, weekStartDate]);

  const weekData =
    state.kind === "week_view"
      ? getWeekSessionsFromPlan(state.plan, viewedWeekStart)
      : null;

  const currentWeekData =
    state.kind === "week_view"
      ? getWeekSessionsFromPlan(state.plan, thisWeekStart)
      : null;

  const weekProgress =
    state.kind === "week_view"
      ? getWeekProgress({
          weekData,
          cycleState: state.plan.cycleState,
          weekStartDate,
          weekEndDate,
        })
      : null;

  const currentWeekProgress =
    state.kind === "week_view"
      ? getWeekProgress({
          weekData: currentWeekData,
          cycleState: state.plan.cycleState,
          weekStartDate: thisWeekStart,
          weekEndDate: new Date(
            thisWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ),
        })
      : null;

  const isCurrentWeekComplete =
    (currentWeekProgress?.totalPlanned ?? 0) > 0 &&
    (currentWeekProgress?.completedCount ?? 0) >=
      (currentWeekProgress?.totalPlanned ?? 0);

  const upNextSessionId = useMemo(() => {
    if (!weekData) return null;
    if (isCurrentWeek) return weekProgress?.upNextSessionId ?? null;
    if (isNextWeek && isCurrentWeekComplete) {
      return weekData.sessions[0]?.id ?? null;
    }
    return null;
  }, [
    isCurrentWeek,
    isNextWeek,
    isCurrentWeekComplete,
    weekData,
    weekProgress,
  ]);

  const cycleStateForEffect =
    state.kind === "week_view" ? state.plan.cycleState : null;
  useEffect(() => {
    if (state.kind !== "week_view") return;
  }, [state.kind, cycleStateForEffect]);

  const anchorWeekStartForEffect =
    state.kind === "week_view" ? state.plan.cycle.anchor_week_start : undefined;
  useEffect(() => {
    if (state.kind !== "week_view" || !weekData) return;
    const cycleStartWeekStart = startOfWeek(
      new Date(state.plan.cycle.anchor_week_start),
      {
        weekStartsOn: 1,
      }
    );
    const viewedStart = startOfWeek(viewedWeekStart, { weekStartsOn: 1 });
    const weekIndex = differenceInCalendarWeeks(
      viewedStart,
      cycleStartWeekStart,
      {
        weekStartsOn: 1,
      }
    );
    const weekVariant = weekIndex % 2 === 0 ? "A" : "B";
    console.log("[Planner] Week calc", {
      cycleStartWeekStart: cycleStartWeekStart.toISOString(),
      viewedWeekStart: viewedStart.toISOString(),
      weekIndex,
      weekVariant,
    });
    // anchorWeekStartForEffect tracks state.plan.cycle.anchor_week_start when kind === "week_view"; state.plan not on all variants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.kind,
    anchorWeekStartForEffect,
    viewedWeekStart,
    weekData?.variantKey,
    weekData,
  ]);

  const plannedSessions: PlannedSessionView[] = useMemo(() => {
    if (!weekData) return [];
    const completedCount = weekProgress?.completedCount ?? 0;
    return weekData.sessions.map((session, index) => ({
      plannedSessionTemplateId: session.id,
      title: session.name,
      tags: session.muscleGroups ?? undefined,
      muscleGroups: session.muscleGroups ?? undefined,
      estimatedMins: undefined,
      variantNotes: undefined,
      status: index < completedCount ? "completed" : "planned",
      completedLog: undefined,
      isUpNext: upNextSessionId === session.id,
    }));
  }, [weekData, upNextSessionId, weekProgress?.completedCount]);

  const handlePrevWeek = () => {
    if (!canGoToPrevWeek) return;
    const prev = new Date(viewedWeekStart);
    prev.setDate(prev.getDate() - 7);
    setViewedWeekStart(startOfWeekMonday(prev));
  };

  const handleNextWeek = () => {
    const next = new Date(viewedWeekStart);
    next.setDate(next.getDate() + 7);
    setViewedWeekStart(startOfWeekMonday(next));
  };

  const handleToggleCalendar = useCallback((): void => {
    setIsCalendarOpen((prev) => !prev);
  }, []);

  const handleCalendarDayPress = useCallback(
    (date: Date): void => {
      const weekStart = startOfWeekMonday(date);
      if (weekStart.getTime() < thisWeekStart.getTime()) return;
      setViewedWeekStart(weekStart);
    },
    [thisWeekStart]
  );

  const handleSessionPress = (session: PlannedSessionView) => {
    setSelectedSession(session);
    sessionModal.present();
  };

  const handleStartWorkout = () => {
    if (!selectedSession) return;
    sessionModal.dismiss();
    router.push({
      pathname: "/workout/start",
      params: { plannedSessionId: selectedSession.plannedSessionTemplateId },
    });
  };

  const handleMarkAsDone = async () => {
    if (!selectedSession || state.kind !== "week_view") return;
    sessionModal.dismiss();
    setSelectedSession(null);
    try {
      await completePlannedSession(
        state.plan.cycle.id,
        state.plan,
        selectedSession.plannedSessionTemplateId
      );
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalendarLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight === calendarHeight) return;
      setCalendarHeight(nextHeight);
    },
    [calendarHeight]
  );

  const calendarTransition = useMemo(
    () => ({
      type: "timing" as const,
      duration: reduceMotion ? 0 : 380,
    }),
    [reduceMotion]
  );
  const titleTransition = useMemo(
    () => ({
      type: "timing" as const,
      duration: reduceMotion ? 0 : 240,
    }),
    [reduceMotion]
  );
  const chevronTransition = useMemo(
    () =>
      reduceMotion
        ? { type: "timing" as const, duration: 0 }
        : { type: "spring" as const, damping: 18, stiffness: 110 },
    [reduceMotion]
  );

  if (state.kind === "loading") {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader
          showBackButton={false}
          title="Planner"
          isMainScreen
          rightAddon={<PlanPill />}
        />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading plan..." />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader
          showBackButton={false}
          title="Planner"
          isMainScreen
          rightAddon={<PlanPill />}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text
            style={{
              color: colors.destructive,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {error.message}
          </Text>
          <Button label="Retry" onPress={() => refetch()} variant="outline" />
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
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader
          showBackButton={false}
          title="Planner"
          isMainScreen
          rightAddon={<PlanPill />}
        />
        <View className="flex-1 items-center justify-center px-6">
          <H3 className="mb-2 text-center">Create your plan</H3>
          <P
            className="mb-6 text-center"
            style={{ color: colors.mutedForeground }}
          >
            Choose a template or build a custom split to get started.
          </P>
          <Button
            label="Create your plan"
            icon={<Plus size={20} color={colors.background} className="mr-1" />}
            iconPlacement="left"
            className="w-full"
            onPress={() =>
              router.push({ pathname: "/planner/split-template" } as never)
            }
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
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader
          showBackButton={false}
          title="Planner"
          isMainScreen
          rightAddon={<PlanPill />}
        />
        <View className="flex-1 items-center justify-center px-6">
          <H3 className="mb-2 text-center">Choose how your plan repeats</H3>
          <P
            className="mb-6 text-center"
            style={{ color: colors.mutedForeground }}
          >
            Set the rotation (e.g. A/B alternating) to see your week view.
          </P>
          <Button
            label="Set rotation"
            icon={<Plus size={20} color={colors.background} className="mr-1" />}
            iconPlacement="left"
            className="w-full"
            onPress={() =>
              router.push({ pathname: "/planner/rotation" } as never)
            }
          />
        </View>
      </Screen>
    );
  }

  const isPastWeek = weekEndDate < new Date();
  const totalPlanned = weekData?.totalPlanned ?? 0;
  const completedCount = weekProgress?.completedCount ?? 0;
  const missedCount = 0;

  return (
    <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
      <Stack.Screen options={headerOptions({ title: "Planner" })} />
      <AppHeader
        showBackButton={false}
        title="Planner"
        isMainScreen
        rightAddon={<PlanPill />}
      />
      <ScrollView
        className="mb-8 flex-1 pb-8"
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="min-h-14 flex-row items-center justify-between px-4"
          key={`week-nav-${viewedWeekStart.getTime()}`}
        >
          <Pressable
            onPress={handlePrevWeek}
            disabled={!canGoToPrevWeek}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
              opacity: canGoToPrevWeek ? 1 : 0.5,
            }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>

          <Pressable
            className="flex-1 px-4"
            onPress={handleToggleCalendar}
            hitSlop={getHitSlop()}
            accessibilityRole="button"
            accessibilityLabel={resolveAccessibilityLabel({
              fallback: isCalendarOpen
                ? "Collapse calendar"
                : "Expand calendar",
            })}
          >
            <View className="items-center">
              <View className="flex-row items-center">
                <AnimatePresence exitBeforeEnter>
                  <MotiView
                    key={isCalendarOpen ? "month" : "range"}
                    from={{
                      opacity: 0,
                      translateY: reduceMotion ? 0 : -4,
                    }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{
                      opacity: 0,
                      translateY: reduceMotion ? 0 : 4,
                    }}
                    transition={titleTransition}
                    className="ml-6 flex-1 items-center justify-center"
                  >
                    <Text
                      style={{
                        fontSize: tokens.typography.sizes.md,
                        color: colors.mutedForeground,
                        fontWeight: tokens.typography.weights.medium,
                      }}
                    >
                      {calendarTitleText}
                    </Text>
                  </MotiView>
                </AnimatePresence>
                <MotiView
                  animate={{
                    rotate: isCalendarOpen ? "180deg" : "0deg",
                  }}
                  transition={chevronTransition}
                >
                  <ChevronUp size={18} color={colors.mutedForeground} />
                </MotiView>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={handleNextWeek}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
            }}
          >
            <ChevronRight size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="px-4" style={{ position: "relative" }}>
          <View
            pointerEvents="none"
            onLayout={handleCalendarLayout}
            style={{ position: "absolute", left: 0, right: 0, opacity: 0 }}
          >
            <PlannerMonthCalendar
              monthDate={weekStartDate}
              rangeStart={weekStartDate}
              rangeEnd={weekEndDate}
            />
          </View>
          <MotiView
            pointerEvents={isCalendarOpen ? "auto" : "none"}
            style={{
              overflow: "hidden",
              height: isCalendarOpen ? calendarHeight : 0,
              opacity: isCalendarOpen ? 1 : 0,
            }}
            transition={calendarTransition}
            animate={{
              height: isCalendarOpen ? calendarHeight : 0,
              opacity: isCalendarOpen ? 1 : 0,
            }}
            from={{
              height: 0,
              opacity: 0,
            }}
          >
            <PlannerMonthCalendar
              monthDate={weekStartDate}
              rangeStart={weekStartDate}
              rangeEnd={weekEndDate}
              onDayPress={handleCalendarDayPress}
            />
          </MotiView>
        </View>

        <View>
          {weekData &&
          getRotationType(state.plan.cycle.rotation) === "ALTERNATE_AB" ? (
            <P
              style={{
                fontSize: tokens.typography.sizes.md,
                fontWeight: tokens.typography.weights.medium,
                color: colors.mutedForeground,
                marginBottom: tokens.spacing.md,
                textAlign: "center",
                marginTop: isCalendarOpen ? 4 : 0,
              }}
            >
              {state.plan.split.name} • Week {weekData.variantKey}
            </P>
          ) : (
            <P
              style={{
                fontSize: tokens.typography.sizes.md,
                fontWeight: tokens.typography.weights.medium,
                color: colors.mutedForeground,
                marginBottom: tokens.spacing.md,
                textAlign: "center",
                marginTop: isCalendarOpen ? 4 : 0,
              }}
            >
              {state.plan.split.name}
            </P>
          )}
        </View>

        <View className="mb-6 px-4">
          <View
            className="rounded-lg px-4 py-3"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.sizes.md,
                fontWeight: tokens.typography.weights.semibold,
                color: colors.foreground,
              }}
            >
              {completedCount} / {totalPlanned} sessions done
            </Text>
            {missedCount > 0 && isPastWeek && (
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.destructive,
                  marginTop: 4,
                }}
              >
                {missedCount} missed
              </Text>
            )}
          </View>
        </View>

        <View
          className="px-4"
          key={`sessions-${viewedWeekStart.getTime()}-${weekData?.variantKey ?? ""}`}
        >
          <H3 className="mb-3">{sessionsHeaderText}</H3>
          {completedCount >= totalPlanned && totalPlanned > 0 && (
            <View
              className="mb-3 rounded-lg px-4 py-3"
              style={{
                backgroundColor: `${colors.primary}12`,
                borderWidth: 1,
                borderColor: `${colors.primary}40`,
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.primary,
                  fontWeight: tokens.typography.weights.semibold,
                }}
              >
                All sessions complete
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.mutedForeground,
                  marginTop: 4,
                }}
              >
                Nice work! You’re done for this week.
              </Text>
            </View>
          )}
          {plannedSessions.map((session) => (
            <SessionCard
              key={`${viewedWeekStart.getTime()}-${session.plannedSessionTemplateId}`}
              session={session}
              onPress={() => handleSessionPress(session)}
              isPastWeek={isPastWeek}
            />
          ))}
        </View>

        <View className="mt-6 px-4 pb-8">
          <Button
            label="Add extra session"
            icon={<Plus size={20} color={colors.background} className="mr-1" />}
            iconPlacement="left"
            onPress={() => {}}
            variant="default"
          />
        </View>
      </ScrollView>

      <Modal
        ref={sessionModal.ref}
        snapPoints={["50%"]}
        title={selectedSession?.title || "Session Actions"}
      >
        {selectedSession && (
          <View className="px-4 pb-8">
            {!isCurrentWeek && (
              <View
                className="mb-4 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: `${colors.muted}40`,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    color: colors.mutedForeground,
                  }}
                >
                  Only current week sessions can be started or marked complete.
                </Text>
              </View>
            )}
            <View style={{ marginBottom: tokens.spacing.md }}>
              <Button
                label="Start workout"
                onPress={handleStartWorkout}
                variant="primary"
                disabled={!isCurrentWeek}
              />
            </View>
            <View style={{ marginBottom: tokens.spacing.md }}>
              <Button
                label="Mark as done"
                onPress={handleMarkAsDone}
                variant="outline"
                disabled={!isCurrentWeek}
              />
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  );
}

type WeekProgressInput = {
  weekData: ReturnType<typeof getWeekSessionsFromPlan> | null;
  cycleState: {
    session_index_a: number;
    session_index_b: number;
    session_index_c: number;
    last_completed_at: string | null;
  };
  weekStartDate: Date;
  weekEndDate: Date;
};

type WeekProgressResult = {
  completedCount: number;
  upNextSessionId: string | null;
  totalPlanned: number;
};

function getWeekProgress(input: WeekProgressInput): WeekProgressResult | null {
  const { weekData, cycleState, weekStartDate, weekEndDate } = input;
  if (!weekData) return null;

  const sessions = weekData.sessions;
  const total = sessions.length;
  const lastCompletedAt = cycleState.last_completed_at
    ? new Date(cycleState.last_completed_at)
    : null;
  const isInWeek =
    lastCompletedAt !== null &&
    lastCompletedAt.getTime() >= weekStartDate.getTime() &&
    lastCompletedAt.getTime() <= weekEndDate.getTime();

  const nextIndex =
    weekData.variantKey === "B"
      ? cycleState.session_index_b
      : weekData.variantKey === "C"
        ? cycleState.session_index_c
        : cycleState.session_index_a;

  let completedCount = isInWeek ? Math.min(nextIndex, total) : 0;
  if (isInWeek && total > 0 && nextIndex === 0) {
    completedCount = total;
  }

  const upNextSessionId =
    completedCount >= total ? null : (sessions[nextIndex]?.id ?? null);

  return { completedCount, upNextSessionId, totalPlanned: total };
}

type SessionCardProps = {
  session: PlannedSessionView;
  onPress: () => void;
  isPastWeek: boolean;
};

function SessionCard({ session, onPress, isPastWeek }: SessionCardProps) {
  const { colors, tokens } = useTheme();

  const statusColor =
    session.status === "completed"
      ? colors.primary
      : session.status === "missed"
        ? colors.destructive
        : colors.mutedForeground;

  const statusBg =
    session.status === "completed"
      ? `${colors.primary}20`
      : session.status === "missed"
        ? `${colors.destructive}20`
        : `${colors.muted}40`;

  return (
    <Pressable onPress={onPress}>
      <Card
        className="mb-3"
        style={{
          opacity: isPastWeek && session.status === "missed" ? 0.6 : 1,
          borderWidth: session.isUpNext ? 2 : 1,
          borderColor: session.isUpNext ? colors.primary : colors.border,
        }}
      >
        <CardHeader>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <CardTitle>{session.title}</CardTitle>
              {session.variantNotes && (
                <CardDescription>{session.variantNotes}</CardDescription>
              )}
              {session.tags && session.tags.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {session.tags.map((tag) => (
                    <View
                      key={tag}
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <Text
                        style={{
                          fontSize: tokens.typography.sizes.xs,
                          color: colors.mutedForeground,
                        }}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: statusBg }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  fontWeight: tokens.typography.weights.medium,
                  color: statusColor,
                  textTransform: "uppercase",
                }}
              >
                {session.status}
              </Text>
            </View>
          </View>
        </CardHeader>
        {session.isUpNext && (
          <CardContent>
            <View
              className="rounded-lg px-3 py-2"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.primary,
                  fontWeight: tokens.typography.weights.medium,
                }}
              >
                Up next
              </Text>
            </View>
          </CardContent>
        )}
        {session.estimatedMins && session.status === "planned" && (
          <CardFooter>
            <Text
              style={{
                fontSize: tokens.typography.sizes.sm,
                color: colors.mutedForeground,
              }}
            >
              Estimated: {session.estimatedMins} min
            </Text>
          </CardFooter>
        )}
      </Card>
    </Pressable>
  );
}
