import { Stack } from "expo-router";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { P, View } from "@/components/ui";
import { EmptyState, Skeleton } from "@/components/feedback-states";

export default function Planner() {
  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Planner" })} />
      <AppHeader showBackButton={false} title="Planner" isMainScreen />
      <P>Empty State</P>
      <EmptyState
        title="No Plans Yet"
        description="You haven't created any workout plans yet. Start planning your fitness journey now!"
      />
      <P className="mb-4 mt-8">Skeleton Loaders</P>
      <View className="flex-row items-center justify-normal">
        <Skeleton variant="avatar" />
        <View className="ml-4 flex-1">
          <Skeleton variant="text" />
          <Skeleton variant="list" style={{ marginTop: 16 }} />
        </View>
      </View>
      <Skeleton variant="card" style={{ marginTop: 16 }} />
      <Skeleton height={40} width={200} radius={20} style={{ marginTop: 16 }} />
    </Screen>
  );
}
