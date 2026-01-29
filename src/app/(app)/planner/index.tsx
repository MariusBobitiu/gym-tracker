import React, { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react-native";
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
import { formatWeekRange, getWeekRange, startOfWeekMonday } from "@/features/planner/date-utils";
import { getWeekSessionsFromPlan } from "@/features/planner/planner-repository";
import { useActivePlan } from "@/features/planner/use-active-plan";
import type { PlannedSessionView } from "@/features/planner/planner-types";
import { ScrollView } from "moti";
import { LoadingState } from "@/components/feedback-states";
import { getHitSlop } from "@/lib/accessibility";

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
  const [selectedSession, setSelectedSession] = useState<PlannedSessionView | null>(null);
  const sessionModal = useModal();

  const { state, error, refetch } = useActivePlan();

  const [weekStartDate, weekEndDate] = useMemo(
    () => getWeekRange(viewedWeekStart),
    [viewedWeekStart]
  );
  const weekRangeText = useMemo(
    () => formatWeekRange(weekStartDate, weekEndDate),
    [weekStartDate, weekEndDate]
  );

  const weekData =
    state.kind === "week_view" ? getWeekSessionsFromPlan(state.plan, viewedWeekStart) : null;

  const plannedSessions: PlannedSessionView[] = useMemo(() => {
    if (!weekData) return [];
    return weekData.sessions.map((s, index) => ({
      plannedSessionTemplateId: s.id,
      title: s.name,
      tags: s.muscleGroups ?? undefined,
      muscleGroups: s.muscleGroups ?? undefined,
      estimatedMins: undefined,
      variantNotes: undefined,
      status: "planned" as const,
      completedLog: undefined,
      isUpNext: index === 0,
    }));
  }, [weekData]);

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

  const handleMarkAsDone = () => {
    if (!selectedSession) return;
    sessionModal.dismiss();
    setSelectedSession(null);
  };

  if (state.kind === "loading") {
    return (
      <Screen className="pb-24">
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
      <Screen className="pb-24">
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
      <Screen className="pb-24">
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
      <Screen className="pb-24">
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
  const completedCount = 0;
  const missedCount = 0;

  return (
    <Screen safeAreaEdges={["top", "bottom"]}>
      <Stack.Screen options={headerOptions({ title: "Planner" })} />
      <AppHeader showBackButton={false} title="Planner" isMainScreen rightAddon={<PlanPill />} />
      <ScrollView className="mb-8 flex-1 pb-8">
        <View className="mb-4 flex-row items-center justify-between px-4">
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

          <View className="flex-1 items-center px-4">
            <Text
              style={{
                fontSize: tokens.typography.sizes.sm,
                color: colors.mutedForeground,
                fontWeight: tokens.typography.weights.medium,
              }}>
              {weekRangeText}
            </Text>
            {weekData && (
              <Text
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  color: colors.mutedForeground,
                  marginTop: 4,
                }}>
                {state.plan.split.name} • Week {weekData.variantKey}
              </Text>
            )}
          </View>

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

        <View className="px-4">
          <H2 className="mb-3">This week&apos;s sessions</H2>
          {plannedSessions.map((session) => (
            <SessionCard
              key={session.plannedSessionTemplateId}
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
            <View style={{ marginBottom: tokens.spacing.md }}>
              <Button label="Start workout" onPress={handleStartWorkout} variant="primary" />
            </View>
            <View style={{ marginBottom: tokens.spacing.md }}>
              <Button label="Mark as done" onPress={handleMarkAsDone} variant="outline" />
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  );
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
