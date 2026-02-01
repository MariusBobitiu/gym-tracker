import React from "react";
import { Stack } from "expo-router";
import { CalendarClock, Dumbbell, Timer } from "lucide-react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Card, H3, P, Small, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useSession } from "@/lib/auth/context";
import { LinearGradient } from "expo-linear-gradient";

type StatItem = {
  label: string;
  value: string;
};

type LiftItem = {
  name: string;
  detail: string;
};

const stats: StatItem[] = [
  { label: "Weeks trained", value: "12" },
  { label: "Sessions", value: "48" },
  { label: "Total weight lifted", value: "1.2M kg" },
];

const bestLifts: LiftItem[] = [
  { name: "Bench Press", detail: "100 kg x 5" },
  { name: "Squat", detail: "140 kg x 3" },
  { name: "Deadlift", detail: "180 kg x 2" },
];

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

function ProfileHeader(): React.ReactElement {
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

function BentoGrid(): React.ReactElement {
  const { colors } = useTheme();

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
              2
            </Text>
            <P style={{ color: colors.mutedForeground }}>of 3 sessions</P>
          </View>
          <View
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <View
              className="h-2 rounded-full"
              style={{ width: "66%", backgroundColor: colors.primary }}
            />
          </View>
          <P style={{ color: colors.mutedForeground }}>Next: Core + Upper</P>
        </Card>
        <View className="flex-1 gap-3">
          <BentoCard title="Up next" value="1" subtitle="Session remaining" />
          <BentoCard
            title="Last week"
            value="3"
            subtitle="Sessions completed"
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
            5h 20m
          </Text>
          <Small style={{ color: colors.mutedForeground }}>Last 14 days</Small>
        </Card>
        <Card className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Dumbbell size={18} color={colors.mutedForeground} />
            <Small style={{ color: colors.mutedForeground }}>Volume PRs</Small>
          </View>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 24,
              fontWeight: "700",
              lineHeight: 24,
            }}
          >
            +12%
          </Text>
          <Small style={{ color: colors.mutedForeground }}>
            Since last cycle
          </Small>
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

function BestLifts(): React.ReactElement {
  return (
    <View className="gap-3">
      <H3>Best lifts</H3>
      <Card>
        {bestLifts.map((lift, index) => (
          <BestLiftRow
            key={lift.name}
            name={lift.name}
            detail={lift.detail}
            showDivider={index < bestLifts.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}

export function ProfileScreen(): React.ReactElement {
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
          <ProfileHeader />
          <BentoGrid />
          <BestLifts />
        </View>
      </View>
    </Screen>
  );
}

export default ProfileScreen;
