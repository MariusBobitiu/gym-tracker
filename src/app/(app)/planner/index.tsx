import React, { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarWeeks, startOfWeek } from "date-fns";
import { Stack, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LayoutAnimation, Platform, Pressable, UIManager, View } from "react-native";
import {
  ChevronDown,
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
  H2,
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
import { ScrollView } from "moti";
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
      hitSlop={getHitSlop()}>
      <Settings2 size={28} color={colors.foreground} />
    </Pressable>
  );
}

export default function Planner() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [viewedWeekStart, setViewedWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PlannedSessionView | null>(null);
  const sessionModal = useModal();
  const reduceMotion = useReducedMotion();

  const { state, error, refetch } = useActivePlan();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [weekStartDate, weekEndDate] = useMemo(
    () => getWeekRange(viewedWeekStart),
    [viewedWeekStart]
  );
  const isCurrentWeek = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const viewedStart = startOfWeek(viewedWeekStart, { weekStartsOn: 1 });
    return todayWeekStart.getTime() === viewedStart.getTime();
  }, [viewedWeekStart]);
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

  const weekData =
    state.kind === "week_view" ? getWeekSessionsFromPlan(state.plan, viewedWeekStart) : null;

  const weekProgress =
    state.kind === "week_view"
      ? getWeekProgress({
          weekData,
          cycleState: state.plan.cycleState,
          weekStartDate,
          weekEndDate,
        })
      : null;
  const upNextSessionId = weekProgress?.upNextSessionId ?? null;

  useEffect(() => {
    if (state.kind !== "week_view") return;
    console.log("[Planner] cycle_state", state.plan.cycleState);
  }, [state.kind, state.kind === "week_view" ? state.plan.cycleState : null]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!UIManager.setLayoutAnimationEnabledExperimental) return;
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  useEffect(() => {
    if (state.kind !== "week_view" || !weekData) return;
    const cycleStartWeekStart = startOfWeek(new Date(state.plan.cycle.anchor_week_start), {
      weekStartsOn: 1,
    });
    const viewedStart = startOfWeek(viewedWeekStart, { weekStartsOn: 1 });
    const weekIndex = differenceInCalendarWeeks(viewedStart, cycleStartWeekStart, {
      weekStartsOn: 1,
    });
    const weekVariant = weekIndex % 2 === 0 ? "A" : "B";
    console.log("[Planner] Week calc", {
      cycleStartWeekStart: cycleStartWeekStart.toISOString(),
      viewedWeekStart: viewedStart.toISOString(),
      weekIndex,
      weekVariant,
    });
  }, [
    state.kind,
    state.kind === "week_view" ? state.plan.cycle.anchor_week_start : undefined,
    viewedWeekStart,
    weekData?.variantKey,
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
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsCalendarOpen((prev) => !prev);
  }, [reduceMotion]);

  const handleCalendarDayPress = useCallback((date: Date): void => {
    setViewedWeekStart(startOfWeekMonday(date));
  }, []);

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

  if (state.kind === "loading") {
    return (
      <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading plan..." />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ color: colors.destructive, textAlign: "center", marginBottom: 16 }}>
            {error.message}
          </Text>
          <Button label="Retry" onPress={() => refetch()} variant="outline" />
        </View>
      </Screen>
    );
  }

  if (state.kind === "hard_empty") {
    return (
      <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
        <View className="flex-1 items-center justify-center px-6">
          <H3 className="mb-2 text-center">Create your plan</H3>
          <P className="mb-6 text-center" style={{ color: colors.mutedForeground }}>
            Choose a template or build a custom split to get started.
          </P>
          <Button
            label="Create your plan"
            icon={<Plus size={20} color={colors.background} className="mr-1" />}
            iconPlacement="left"
            className="w-full"
            onPress={() => router.push({ pathname: "/planner/split-template" } as never)}
          />
        </View>
      </Screen>
    );
  }

  if (state.kind === "needs_rotation") {
    return (
      <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
        <View className="flex-1 items-center justify-center px-6">
          <H3 className="mb-2 text-center">Choose how your plan repeats</H3>
          <P className="mb-6 text-center" style={{ color: colors.mutedForeground }}>
            Set the rotation (e.g. A/B alternating) to see your week view.
          </P>
          <Button
            label="Set rotation"
            icon={<Plus size={20} color={colors.background} className="mr-1" />}
            iconPlacement="left"
            className="w-full"
            onPress={() => router.push({ pathname: "/planner/rotation" } as never)}
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
      <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
      <ScrollView className="mb-8 flex-1 pb-8">
        <View
          className="mb-4 flex-row items-center justify-between px-4"
          key={`week-nav-${viewedWeekStart.getTime()}`}>
          <Pressable
            onPress={handlePrevWeek}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
            }}>
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>

          <Pressable
            className="flex-1 px-4"
            onPress={handleToggleCalendar}
            hitSlop={getHitSlop()}
            accessibilityRole="button"
            accessibilityLabel={resolveAccessibilityLabel({
              fallback: isCalendarOpen ? "Collapse calendar" : "Expand calendar",
            })}>
            <View className="items-center">
              <View className="flex-row items-center">
                <Text
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    color: colors.mutedForeground,
                    fontWeight: tokens.typography.weights.medium,
                  }}>
                  {weekRangeText}
                </Text>
                <View className="ml-1">
                  {isCalendarOpen ? (
                    <ChevronUp size={16} color={colors.mutedForeground} />
                  ) : (
                    <ChevronDown size={16} color={colors.mutedForeground} />
                  )}
                </View>
              </View>
              {weekData &&
                (getRotationType(state.plan.cycle.rotation) === "ALTERNATE_AB" ? (
                  <Text
                    style={{
                      fontSize: tokens.typography.sizes.xs,
                      color: colors.mutedForeground,
                      marginTop: 4,
                    }}>
                    {state.plan.split.name} • Week {weekData.variantKey}
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontSize: tokens.typography.sizes.xs,
                      color: colors.mutedForeground,
                      marginTop: 4,
                    }}>
                    {state.plan.split.name}
                  </Text>
                ))}
            </View>
          </Pressable>

          <Pressable
            onPress={handleNextWeek}
            className="flex-row items-center"
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor: colors.muted,
            }}>
            <ChevronRight size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {isCalendarOpen && (
          <View className="mb-4 px-4">
            <PlannerMonthCalendar
              monthDate={weekStartDate}
              rangeStart={weekStartDate}
              rangeEnd={weekEndDate}
              onDayPress={handleCalendarDayPress}
            />
          </View>
        )}

        <View className="mb-6 px-4">
          <View
            className="rounded-lg px-4 py-3"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text
              style={{
                fontSize: tokens.typography.sizes.md,
                fontWeight: tokens.typography.weights.semibold,
                color: colors.foreground,
              }}>
              {completedCount} / {totalPlanned} sessions done
            </Text>
            {missedCount > 0 && isPastWeek && (
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.destructive,
                  marginTop: 4,
                }}>
                {missedCount} missed
              </Text>
            )}
          </View>
        </View>

        <View
          className="px-4"
          key={`sessions-${viewedWeekStart.getTime()}-${weekData?.variantKey ?? ""}`}>
          <H2 className="mb-3">{sessionsHeaderText}</H2>
          {completedCount >= totalPlanned && totalPlanned > 0 && (
            <View
              className="mb-3 rounded-lg px-4 py-3"
              style={{
                backgroundColor: `${colors.primary}12`,
                borderWidth: 1,
                borderColor: `${colors.primary}40`,
              }}>
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.primary,
                  fontWeight: tokens.typography.weights.semibold,
                }}>
                All sessions complete
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.mutedForeground,
                  marginTop: 4,
                }}>
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
            icon={<Plus size={20} color={colors.foreground} />}
            iconPlacement="left"
            onPress={() => {}}
            variant="outline"
          />
        </View>
      </ScrollView>

      <Modal
        ref={sessionModal.ref}
        snapPoints={["50%"]}
        title={selectedSession?.title || "Session Actions"}>
        {selectedSession && (
          <View className="px-4 pb-8">
            {!isCurrentWeek && (
              <View
                className="mb-4 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: `${colors.muted}40`,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    color: colors.mutedForeground,
                  }}>
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

  const upNextSessionId = completedCount >= total ? null : (sessions[nextIndex]?.id ?? null);

  return { completedCount, upNextSessionId };
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
        }}>
        <CardHeader>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <CardTitle>{session.title}</CardTitle>
              {session.variantNotes && <CardDescription>{session.variantNotes}</CardDescription>}
              {session.tags && session.tags.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {session.tags.map((tag) => (
                    <View
                      key={tag}
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: colors.muted }}>
                      <Text
                        style={{
                          fontSize: tokens.typography.sizes.xs,
                          color: colors.mutedForeground,
                        }}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusBg }}>
              <Text
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  fontWeight: tokens.typography.weights.medium,
                  color: statusColor,
                  textTransform: "uppercase",
                }}>
                {session.status}
              </Text>
            </View>
          </View>
        </CardHeader>
        {session.isUpNext && (
          <CardContent>
            <View
              className="rounded-lg px-3 py-2"
              style={{ backgroundColor: `${colors.primary}15` }}>
              <Text
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  color: colors.primary,
                  fontWeight: tokens.typography.weights.medium,
                }}>
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
              }}>
              Estimated: {session.estimatedMins} min
            </Text>
          </CardFooter>
        )}
      </Card>
    </Pressable>
  );
}
