import { Stack } from "expo-router";
import { View } from "@/components/ui";
import { BottomNavigation } from "@/components/bottom-navigation";
import { BackgroundGradient } from "@/components/background-gradient";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { OfflineBanner } from "@/components/offline-banner";
import { useTheme } from "@/lib/theme-context";
import { PlannerDbProvider } from "@/lib/planner-db/planner-db-provider";
import { useConnectivityRecovery } from "@/hooks/use-connectivity-recovery";

export default function Layout() {
  const { colors } = useTheme();
  useConnectivityRecovery();

  return (
    <View className="flex-1">
      <BackgroundGradient />
      <OfflineBanner />
      <PlannerDbProvider>
        <NotificationScheduler />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 150,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="workout"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              animationDuration: 300,
            }}
          />
        </Stack>
        <BottomNavigation />
      </PlannerDbProvider>
    </View>
  );
}
