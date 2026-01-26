import * as React from "react";
import { Stack } from "expo-router";
import { Bell, ChevronRight, Settings } from "lucide-react-native";
import { Button, Text, View } from "@/components/ui";
import AppHeader from "@/components/app-header";
import { Screen } from "@/components/screen";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth/context";

type WeekDot = {
  id: string;
  isActive?: boolean;
};

const WEEK_DOTS: WeekDot[] = [
  { id: "mon" },
  { id: "tue" },
  { id: "wed" },
  { id: "thu" },
  { id: "fri", isActive: true },
  { id: "sat" },
  { id: "sun" },
];

function WeekSummary(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View className="mt-12 flex-1">
      <View className="flex-row items-center gap-6">
        <Text style={{ color: colors.mutedForeground }}>This week</Text>
        <View className="flex-1 flex-row items-center gap-2">
          {WEEK_DOTS.map((dot) => (
            <View
              key={dot.id}
              className="size-2.5 rounded-full"
              style={{ backgroundColor: dot.isActive ? colors.primary : colors.border }}
            />
          ))}
        </View>
      </View>
      <Text className="text-sm" style={{ color: colors.mutedForeground }}>
        2 sessions completed · Push yesterday
      </Text>
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
      }}>
      <Text className="uppercase tracking-[2px]" style={{ color: colors.mutedForeground }}>
        Ready to train
      </Text>
      <Text
        className="font-inter mt-3 font-semibold"
        style={{ fontSize: 28, lineHeight: 32, color: colors.foreground }}>
        Pull
      </Text>
      <Text className="mt-1 text-base" style={{ color: colors.mutedForeground }}>
        Back & biceps
      </Text>
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
    </View>
  );
}

export default function Home(): React.ReactElement {
  const { user } = useAuth();

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const userName = user?.name?.split(" ")[0] || "there";
    return `${timeGreeting}, ${userName}`;
  }, [user?.name]);

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerClassName="pb-28 pt-4">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader showBackButton={false} title={greeting} isMainScreen />
      <WeekSummary />
      <ReadyToTrainCard />
    </Screen>
  );
}
