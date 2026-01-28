import React, { useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react-native";
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
  P,
  Text,
} from "@/components/ui";
import { Modal, useModal } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme-context";
import { usePlannerStore } from "@/features/planner/planner-store";
import { formatWeekRange, getWeekRange, startOfWeekMonday } from "@/features/planner/date-utils";
import type { PlannedSessionView } from "@/features/planner/planner-types";

export default function Planner() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [viewedWeekStart, setViewedWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedSession, setSelectedSession] = useState<PlannedSessionView | null>(null);
  const sessionModal = useModal();

  const {
    initialize,
    getWeekInstance,
    markSessionAsDone,
    addExtraSession,
    reorderSessions,
    carrySessionToNextWeek,
    setActivePlannedSessionId,
    patterns,
    activeCycleInstance,
  } = usePlannerStore();

  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const weekInstance = useMemo(() => {
    return getWeekInstance(viewedWeekStart);
  }, [viewedWeekStart, getWeekInstance]); // getWeekInstance is stable from zustand

  const [weekStartDate, weekEndDate] = useMemo(() => {
    return getWeekRange(viewedWeekStart);
  }, [viewedWeekStart]); // getWeekRange is stable from zustand

  const weekRangeText = useMemo(() => {
    return formatWeekRange(weekStartDate, weekEndDate);
  }, [weekStartDate, weekEndDate]);

  const pattern = useMemo(() => {
    if (!activeCycleInstance) return null;
    return patterns.find((p) => p.id === activeCycleInstance.patternId);
  }, [patterns, activeCycleInstance]);

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
    setActivePlannedSessionId(selectedSession.plannedSessionTemplateId);
    sessionModal.dismiss();
    router.push({
      pathname: "/workout/start",
      params: { plannedSessionId: selectedSession.plannedSessionTemplateId },
    });
  };

  const handleMarkAsDone = () => {
    if (!selectedSession || !weekInstance) return;
    markSessionAsDone(selectedSession.plannedSessionTemplateId, viewedWeekStart, {
      date: Date.now(),
      actualSessionTitle: selectedSession.title,
      durationMins: selectedSession.estimatedMins,
    });
    sessionModal.dismiss();
    setSelectedSession(null);
  };

  const handleMoveUp = () => {
    if (!selectedSession || !weekInstance) return;
    const currentIndex = weekInstance.plannedSessions.findIndex(
      (s) => s.plannedSessionTemplateId === selectedSession.plannedSessionTemplateId
    );
    if (currentIndex <= 0) return;
    const newOrder = [...weekInstance.plannedSessions.map((s) => s.plannedSessionTemplateId)];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
      newOrder[currentIndex],
      newOrder[currentIndex - 1],
    ];
    reorderSessions(viewedWeekStart, newOrder);
  };

  const handleMoveDown = () => {
    if (!selectedSession || !weekInstance) return;
    const currentIndex = weekInstance.plannedSessions.findIndex(
      (s) => s.plannedSessionTemplateId === selectedSession.plannedSessionTemplateId
    );
    if (currentIndex >= weekInstance.plannedSessions.length - 1) return;
    const newOrder = [...weekInstance.plannedSessions.map((s) => s.plannedSessionTemplateId)];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
      newOrder[currentIndex + 1],
      newOrder[currentIndex],
    ];
    reorderSessions(viewedWeekStart, newOrder);
  };

  const handleCarryToNextWeek = () => {
    if (!selectedSession) return;
    carrySessionToNextWeek(viewedWeekStart, selectedSession.plannedSessionTemplateId);
    sessionModal.dismiss();
    setSelectedSession(null);
  };

  const handleAddExtraSession = () => {
    // Simple implementation: create a basic extra session
    const extraSession = {
      id: `extra-${Date.now()}`,
      title: "Extra Session",
      tags: [],
      estimatedMins: 45,
    };
    addExtraSession(viewedWeekStart, extraSession);
  };

  if (!weekInstance || !pattern) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Planner" })} />
        <AppHeader showBackButton={false} title="Planner" isMainScreen />
        <View className="flex-1 items-center justify-center">
          <P>No active cycle. Please create one.</P>
        </View>
      </Screen>
    );
  }

  const isPastWeek = weekEndDate < new Date();

  return (
    <Screen className="pb-24" preset="scroll">
      <Stack.Screen options={headerOptions({ title: "Planner" })} />
      <AppHeader showBackButton={false} title="Planner" isMainScreen />

      {/* Week Navigation Header */}
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
          <Text
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: colors.mutedForeground,
              marginTop: 4,
            }}>
            {pattern.name} • Week {weekInstance.templateLabel}
          </Text>
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

      {/* Progress Indicator */}
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
            {weekInstance.completedCount} / {weekInstance.totalPlanned} sessions done
          </Text>
          {weekInstance.missedCount > 0 && isPastWeek && (
            <Text
              style={{
                fontSize: tokens.typography.sizes.sm,
                color: colors.destructive,
                marginTop: 4,
              }}>
              {weekInstance.missedCount} missed
            </Text>
          )}
        </View>
      </View>

      {/* Sessions List */}
      <View className="px-4">
        <H2 className="mb-3">This week&apos;s sessions</H2>
        {weekInstance.plannedSessions.map((session, index) => (
          <SessionCard
            key={session.plannedSessionTemplateId}
            session={session}
            onPress={() => handleSessionPress(session)}
            isPastWeek={isPastWeek}
          />
        ))}

        {/* Extra Sessions */}
        {weekInstance.extraSessions.length > 0 && (
          <View className="mt-6">
            <H2 className="mb-3">Extra sessions</H2>
            {weekInstance.extraSessions.map((log) => (
              <Card key={log.id} className="mb-3">
                <CardHeader>
                  <CardTitle>{log.actualSessionTitle}</CardTitle>
                  {log.durationMins && <CardDescription>{log.durationMins} min</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="mt-6 px-4 pb-8">
        <View style={{ marginBottom: tokens.spacing.md }}>
          <Button
            label="Add extra session"
            icon={<Plus size={20} color={colors.foreground} />}
            iconPlacement="left"
            onPress={handleAddExtraSession}
            variant="outline"
          />
        </View>
        <Button
          label="Manage cycle"
          icon={<Settings size={20} color={colors.foreground} />}
          iconPlacement="left"
          onPress={() => {
            // TODO: Implement manage cycle modal
            console.log("Manage cycle");
          }}
          variant="outline"
        />
      </View>

      {/* Session Action Modal */}
      <Modal
        ref={sessionModal.ref}
        snapPoints={["50%"]}
        title={selectedSession?.title || "Session Actions"}>
        {selectedSession && (
          <View className="px-4 pb-8">
            {selectedSession.status === "planned" && (
              <>
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Button label="Start workout" onPress={handleStartWorkout} variant="primary" />
                </View>
                <View style={{ marginBottom: tokens.spacing.md }}>
                  <Button label="Mark as done" onPress={handleMarkAsDone} variant="outline" />
                </View>
              </>
            )}
            {selectedSession.status === "missed" && (
              <View style={{ marginBottom: tokens.spacing.md }}>
                <Button
                  label="Carry to next week"
                  onPress={handleCarryToNextWeek}
                  variant="outline"
                />
              </View>
            )}
            {selectedSession.status === "completed" && selectedSession.completedLog && (
              <View className="mb-4">
                <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>
                  Completed on {new Date(selectedSession.completedLog.date).toLocaleDateString()}
                </Text>
                {selectedSession.completedLog.durationMins && (
                  <Text style={{ color: colors.mutedForeground }}>
                    Duration: {selectedSession.completedLog.durationMins} min
                  </Text>
                )}
              </View>
            )}
            <View className="flex-row gap-2">
              <Button
                label="Move up"
                onPress={handleMoveUp}
                variant="ghost"
                size="sm"
                disabled={
                  weekInstance.plannedSessions.findIndex(
                    (s) => s.plannedSessionTemplateId === selectedSession.plannedSessionTemplateId
                  ) === 0
                }
              />
              <Button
                label="Move down"
                onPress={handleMoveDown}
                variant="ghost"
                size="sm"
                disabled={
                  weekInstance.plannedSessions.findIndex(
                    (s) => s.plannedSessionTemplateId === selectedSession.plannedSessionTemplateId
                  ) ===
                  weekInstance.plannedSessions.length - 1
                }
              />
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
                      style={{
                        backgroundColor: colors.muted,
                      }}>
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
            <View
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: statusBg,
              }}>
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
              style={{
                backgroundColor: `${colors.primary}15`,
              }}>
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
        {session.status === "completed" && session.completedLog && (
          <CardFooter>
            <Text
              style={{
                fontSize: tokens.typography.sizes.sm,
                color: colors.mutedForeground,
              }}>
              Completed • {new Date(session.completedLog.date).toLocaleDateString()}
              {session.completedLog.durationMins && ` • ${session.completedLog.durationMins} min`}
            </Text>
          </CardFooter>
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
