import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ScrollView } from "moti";
import { Screen } from "@/components/screen";
import AppHeader, { headerOptions } from "@/components/app-header";
import { ErrorState, LoadingState } from "@/components/feedback-states";
import { H3, P } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useHistorySessionDetail } from "@/hooks/use-history-session-detail";
import { useWeightUnit } from "@/hooks/use-weight-unit";
import type { WorkoutSessionDetail } from "@/features/planner/planner-repository";

function formatDuration(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value <= 0) return "0 mins";
  return `${value} min${value !== 1 ? "s" : ""}`;
}

type HistorySessionSummaryProps = {
  session: WorkoutSessionDetail["session"];
};

function HistorySessionSummary({
  session,
}: HistorySessionSummaryProps): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { formatVolume } = useWeightUnit();

  return (
    <View className="px-4 pt-4">
      <H3>{session.sessionTitle}</H3>
      <P style={{ color: colors.mutedForeground }}>
        {new Date(session.completedAt).toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </P>

      <View className="mt-4" style={{ gap: tokens.spacing.sm }}>
        <View className="flex-row items-center justify-between">
          <P style={{ color: colors.mutedForeground }}>Total Volume</P>
          <P
            style={{
              color: colors.foreground,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            {formatVolume(session.totalVolumeKg)}
          </P>
        </View>
        <View className="flex-row items-center justify-between">
          <P style={{ color: colors.mutedForeground }}>Duration</P>
          <P
            style={{
              color: colors.foreground,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            {formatDuration(session.durationMins)}
          </P>
        </View>
        <View className="flex-row items-center justify-between">
          <P style={{ color: colors.mutedForeground }}>Sets</P>
          <P
            style={{
              color: colors.foreground,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            {session.totalSets}
          </P>
        </View>
        <View className="flex-row items-center justify-between">
          <P style={{ color: colors.mutedForeground }}>Reps</P>
          <P
            style={{
              color: colors.foreground,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            {session.totalReps}
          </P>
        </View>
      </View>
    </View>
  );
}

type HistorySessionSetsProps = {
  sets: WorkoutSessionDetail["sets"];
};

function HistorySessionSets({
  sets,
}: HistorySessionSetsProps): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { formatWeight } = useWeightUnit();

  return (
    <View className="mt-6 px-4" style={{ gap: tokens.spacing.sm }}>
      <H3>Sets</H3>
      {sets.length === 0 ? (
        <P style={{ color: colors.mutedForeground }}>No sets recorded.</P>
      ) : (
        sets.map((set) => (
          <View
            key={set.id}
            className="flex-row items-center justify-between"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radius.md,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
            }}
          >
            <View>
              <P style={{ color: colors.foreground }}>{set.exercise_name}</P>
              <P style={{ color: colors.mutedForeground }}>
                Set {set.set_number}
              </P>
            </View>
            <P
              style={{
                color: colors.foreground,
                fontWeight: tokens.typography.weights.medium,
              }}
            >
              {formatWeight(set.weight)} • {set.reps} reps
            </P>
          </View>
        ))
      )}
    </View>
  );
}

export default function HistorySessionDetail(): React.ReactElement {
  const params = useLocalSearchParams<{ "session-id"?: string }>();
  const rawSessionId = params["session-id"];
  const sessionId = Array.isArray(rawSessionId)
    ? (rawSessionId[0] ?? null)
    : (rawSessionId ?? null);
  const { loading, error, data } = useHistorySessionDetail(sessionId);

  if (loading) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Session" })} />
        <AppHeader showBackButton title="Session" />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading session..." />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Session" })} />
        <AppHeader showBackButton title="Session" />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState
            title="Unable to Load Session"
            description={error.message}
          />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Session" })} />
        <AppHeader showBackButton title="Session" />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState
            title="Session Not Found"
            description="This session does not have a recorded log yet."
          />
        </View>
      </Screen>
    );
  }

  const { session, sets } = data;

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Session" })} />
      <AppHeader showBackButton title="Session" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-16"
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        <HistorySessionSummary session={session} />
        <HistorySessionSets sets={sets} />
      </ScrollView>
    </Screen>
  );
}
