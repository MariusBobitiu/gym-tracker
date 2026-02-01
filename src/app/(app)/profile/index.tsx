import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Stack } from "expo-router";
import { CalendarClock, Dumbbell, Timer } from "lucide-react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Card, H3, P, Small, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useSession } from "@/lib/auth/context";
import { LinearGradient } from "expo-linear-gradient";
import {
  getProfileStats,
  getBestLifts,
  getWorkoutSessionsInRange,
  getWeekSessionsFromPlan,
  getUpNextSession,
} from "@/features/planner/planner-repository";
import type { ActivePlanWithState } from "@/features/planner/planner-repository";
import { getWeekRange, startOfWeekMonday } from "@/features/planner/date-utils";
import { useActivePlan } from "@/features/planner/use-active-plan";
import { useHistoryWeek } from "@/hooks/use-history-week";
import { LoadingState } from "@/components/feedback-states";

type StatItem = {
  label: string;
  value: string;
};

type LiftItem = {
  name: string;
  detail: string;
};

function formatVolumeKg(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M kg`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k kg`;
  return `${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })} kg`;
}

function formatDurationMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatBlock({ label, value }: StatItem): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <View className="flex-1 items-start gap-0.5">
      <P
        style={{
          color: colors.foreground,
          lineHeight: tokens.typography.lineHeights.sm,
        }}
      >
        {value}
      </P>
      <Small
        style={{
          color: colors.mutedForeground,
          fontSize: tokens.typography.sizes["2xs"],
          lineHeight: tokens.typography.lineHeights["2xs"],
        }}
      >
        {label}
      </Small>
    </View>
  );
}

function ProfileHeader({ stats }: { stats: StatItem[] }): React.ReactElement {
  const { colors, tokens } = useTheme();
  const avatarSize = tokens.spacing["3xl"] + tokens.spacing.xl;
  const { user } = useSession();
  const username = typeof user?.username === "string" ? user.username : "-";

  return (
    <View className="flex-row items-center gap-6">
      <View className="flex-row items-center">
        <View
          className="items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <LinearGradient
            colors={["#EDC273", "#F2A012", "#DB7B0D"]}
            start={{ x: 0.1, y: 0.05 }}
            end={{ x: 0.95, y: 0.9 }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: avatarSize / 2,
            }}
          />
          <H3
            style={{
              color: colors.primaryForeground,
              fontSize: tokens.typography.sizes["2xl"],
              fontWeight: tokens.typography.weights.semibold,
            }}
          >
            {username.slice(0, 2).toUpperCase()}
          </H3>
        </View>
      </View>
      <View className="flex-1 flex-col items-start justify-center gap-2">
        <View className="flex-row items-center">
          <P
            style={{
              color: colors.foreground,
              fontSize: tokens.typography.sizes.xl,
              lineHeight: tokens.typography.lineHeights.md,
              fontWeight: tokens.typography.weights.semibold,
            }}
          >
            {username}
          </P>
        </View>
        <View className="flex-row gap-1.5">
          {stats.map((item) => (
            <StatBlock key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>
    </View>
  );
}

function BentoCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}): React.ReactElement {
  const { colors } = useTheme();

  return (
    <Card className="gap-2">
      <Small style={{ color: colors.mutedForeground }}>{title}</Small>
      <Text
        style={{
          color: colors.primary,
          fontSize: 28,
          fontWeight: "700",
          lineHeight: 28,
        }}
      >
        {value}
      </Text>
      <P style={{ color: colors.mutedForeground }}>{subtitle}</P>
    </Card>
  );
}

type BentoGridProps = {
  /** When false, plan is still loading so this week / up next show "—" instead of 0. */
  planReady: boolean;
  thisWeekCompleted: number;
  thisWeekTotal: number;
  upNextSessionName: string | null;
  lastWeekCompleted: number;
  lastWeekTotal: number;
  last14DaysMins: number;
};

function BentoGrid({
  planReady,
  thisWeekCompleted,
  thisWeekTotal,
  upNextSessionName,
  lastWeekCompleted,
  lastWeekTotal,
  last14DaysMins,
}: BentoGridProps): React.ReactElement {
  const { colors } = useTheme();
  const progressPct =
    planReady && thisWeekTotal > 0
      ? Math.min((thisWeekCompleted / thisWeekTotal) * 100, 100)
      : 0;
  const upNext = thisWeekTotal - thisWeekCompleted;
  const upNextLabel = !planReady
    ? "—"
    : upNext > 0 && upNextSessionName
      ? `Next: ${upNextSessionName}`
      : upNext > 0
        ? "Session remaining"
        : "All done this week";

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Card className="flex-1 gap-3">
          <View className="flex-row items-center gap-2">
            <CalendarClock size={18} color={colors.mutedForeground} />
            <Small style={{ color: colors.mutedForeground }}>This week</Small>
          </View>
          <View className="flex-row items-end gap-2">
            <Text
              style={{
                color: colors.primary,
                fontSize: 32,
                fontWeight: "700",
                lineHeight: 32,
              }}
            >
              {planReady ? thisWeekCompleted : "—"}
            </Text>
            <P style={{ color: colors.mutedForeground }}>
              of{" "}
              {planReady && thisWeekTotal > 0
                ? thisWeekTotal
                : planReady
                  ? 0
                  : "—"}{" "}
              sessions
            </P>
          </View>
          <View
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <View
              className="h-2 rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
          <P style={{ color: colors.mutedForeground }}>{upNextLabel}</P>
        </Card>
        <View className="flex-1 gap-3">
          <BentoCard
            title="Up next"
            value={planReady ? String(Math.max(0, upNext)) : "—"}
            subtitle={planReady ? "Session remaining" : "—"}
          />
          <BentoCard
            title="Last week"
            value={String(lastWeekCompleted)}
            subtitle={`of ${lastWeekTotal} sessions`}
          />
        </View>
      </View>
      <View className="flex-row gap-3">
        <Card className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Timer size={18} color={colors.mutedForeground} />
            <Small style={{ color: colors.mutedForeground }}>
              Training time
            </Small>
          </View>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 24,
              fontWeight: "700",
              lineHeight: 24,
            }}
          >
            {last14DaysMins > 0 ? formatDurationMins(last14DaysMins) : "—"}
          </Text>
          <Small style={{ color: colors.mutedForeground }}>Last 14 days</Small>
        </Card>
      </View>
    </View>
  );
}

function BestLiftRow({
  name,
  detail,
  showDivider,
}: LiftItem & { showDivider: boolean }): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center justify-between py-3"
      style={
        showDivider
          ? { borderBottomWidth: 1, borderBottomColor: colors.border }
          : undefined
      }
    >
      <View className="flex-row items-center gap-3">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.muted,
          }}
        >
          <Dumbbell size={18} color={colors.mutedForeground} />
        </View>
        <View>
          <P>{name}</P>
          <Small style={{ color: colors.mutedForeground }}>{detail}</Small>
        </View>
      </View>
      <Text style={{ color: colors.primary, fontWeight: "700" }}>PR</Text>
    </View>
  );
}

function BestLiftsSection({
  lifts,
}: {
  lifts: LiftItem[];
}): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View className="gap-3">
      <H3>Best lifts</H3>
      {lifts.length === 0 ? (
        <Card>
          <P style={{ color: colors.mutedForeground }}>
            Complete workouts to see your PRs here.
          </P>
        </Card>
      ) : (
        <Card>
          {lifts.map((lift, index) => (
            <BestLiftRow
              key={lift.name}
              name={lift.name}
              detail={lift.detail}
              showDivider={index < lifts.length - 1}
            />
          ))}
        </Card>
      )}
    </View>
  );
}

export function ProfileScreen(): React.ReactElement {
  const thisWeekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const { state: planState, refetch: refetchPlan } = useActivePlan();
  const [cachedPlan, setCachedPlan] = useState<ActivePlanWithState | null>(
    null
  );
  const plan = useMemo((): ActivePlanWithState | null => {
    if (planState.kind === "week_view") return planState.plan;
    if (planState.kind === "loading") return cachedPlan;
    return null;
  }, [planState, cachedPlan]);
  const {
    data: thisWeekData,
    loading: thisWeekLoading,
    refetch: refetchThisWeek,
  } = useHistoryWeek(plan, thisWeekStart);

  const [profileStats, setProfileStats] = useState<{
    totalSessions: number;
    totalVolumeKg: number;
    weeksTrained: number;
  } | null>(null);
  const [bestLiftsList, setBestLiftsList] = useState<LiftItem[]>([]);
  const [lastWeekCompleted, setLastWeekCompleted] = useState(0);
  const [lastWeekTotal, setLastWeekTotal] = useState(0);
  const [last14DaysMins, setLast14DaysMins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planState.kind === "week_view") {
      setCachedPlan(planState.plan);
      return;
    }
    if (
      planState.kind === "hard_empty" ||
      planState.kind === "needs_rotation"
    ) {
      setCachedPlan(null);
    }
  }, [planState]);

  const loadProfileData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [stats, lifts] = await Promise.all([
        getProfileStats(),
        getBestLifts(),
      ]);
      setProfileStats(stats);
      setBestLiftsList(
        lifts.map((l) => ({
          name: l.exerciseName,
          detail: `${l.weight} kg × ${l.reps}`,
        }))
      );

      const now = Date.now();
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
      const sessions14 = await getWorkoutSessionsInRange(fourteenDaysAgo, now);
      const totalMins = sessions14.reduce(
        (sum, s) => sum + (s.durationMins ?? 0),
        0
      );
      setLast14DaysMins(totalMins);

      if (plan) {
        const lastWeekMon = new Date(thisWeekStart);
        lastWeekMon.setDate(lastWeekMon.getDate() - 7);
        const [lastWeekStartDate, lastWeekEndDate] = getWeekRange(lastWeekMon);
        const lastWeekSessions = await getWorkoutSessionsInRange(
          lastWeekStartDate.getTime(),
          lastWeekEndDate.getTime()
        );
        const lastWeekPlan = getWeekSessionsFromPlan(plan, lastWeekStartDate);
        const lastWeekIds = new Set(
          lastWeekSessions
            .map((s) => s.plannedSessionTemplateId)
            .filter((id): id is string => Boolean(id))
        );
        setLastWeekCompleted(
          Math.min(lastWeekIds.size, lastWeekPlan.totalPlanned)
        );
        setLastWeekTotal(lastWeekPlan.totalPlanned);
      } else {
        setLastWeekCompleted(0);
        setLastWeekTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [plan, thisWeekStart]);

  useFocusEffect(
    useCallback(() => {
      refetchPlan();
      if (plan) void refetchThisWeek();
      void loadProfileData();
    }, [refetchPlan, plan, refetchThisWeek, loadProfileData])
  );

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  // Refetch this week when plan becomes available (same as Today refetches history when plan is set)
  useEffect(() => {
    if (plan) void refetchThisWeek();
  }, [plan, refetchThisWeek]);

  const stats: StatItem[] = useMemo(() => {
    if (!profileStats) {
      return [
        { label: "Weeks trained", value: "—" },
        { label: "Sessions", value: "—" },
        { label: "Total weight lifted", value: "—" },
      ];
    }
    return [
      { label: "Weeks trained", value: String(profileStats.weeksTrained) },
      { label: "Sessions", value: String(profileStats.totalSessions) },
      {
        label: "Total weight lifted",
        value: formatVolumeKg(profileStats.totalVolumeKg),
      },
    ];
  }, [profileStats]);

  const thisWeekCompleted = thisWeekData?.weekStats?.completedCount ?? 0;
  const thisWeekTotal = thisWeekData?.weekData?.totalPlanned ?? 0;
  const upNextSession = useMemo(() => {
    if (!plan) return null;
    return getUpNextSession(plan, plan.cycleState);
  }, [plan]);
  const upNextSessionName = upNextSession?.sessionName ?? null;

  if (loading && !profileStats) {
    return (
      <Screen
        preset="scroll"
        padding="none"
        safeAreaEdges={["bottom", "top"]}
        contentContainerClassName="flex-1 items-center justify-center pb-20"
      >
        <Stack.Screen options={headerOptions({ title: "Profile" })} />
        <AppHeader showBackButton={false} title="Profile" isMainScreen />
        <LoadingState label="Loading profile..." />
      </Screen>
    );
  }

  return (
    <Screen
      preset="scroll"
      padding="none"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-20"
    >
      <Stack.Screen options={headerOptions({ title: "Profile" })} />
      <View className="px-4 pt-2">
        <AppHeader showBackButton={false} title="Profile" isMainScreen />
        <View className="gap-8">
          <ProfileHeader stats={stats} />
          <BentoGrid
            planReady={plan !== null}
            thisWeekCompleted={thisWeekCompleted}
            thisWeekTotal={thisWeekTotal}
            upNextSessionName={upNextSessionName}
            lastWeekCompleted={lastWeekCompleted}
            lastWeekTotal={lastWeekTotal}
            last14DaysMins={last14DaysMins}
          />
          <BestLiftsSection lifts={bestLiftsList} />
        </View>
      </View>
    </Screen>
  );
}

export default ProfileScreen;
