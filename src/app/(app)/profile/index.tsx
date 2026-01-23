import { Stack } from "expo-router";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { View } from "@/components/ui";
import { ErrorState } from "@/components/feedback-states";

export default function Profile() {
  return (
    <Screen>
      <Stack.Screen options={headerOptions({ title: "Profile" })} />
      <AppHeader showBackButton={false} title="Profile" isMainScreen />
      <View className="flex-1 items-center justify-center pb-48">
        <ErrorState
          title="Unable to Load Profile"
          description="There was an error loading your profile information. Please try again later."
        />
      </View>
    </Screen>
  );
}
