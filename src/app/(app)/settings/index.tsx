import { Link, Stack, router } from "expo-router";
import AppHeader, { headerOptions } from "@/components/app-header";
import { ThemeToggler } from "@/components/theme-toggler";
import { Screen } from "@/components/screen";
import { Button, View } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";

export default function Settings() {
  const { signOut } = useAuth();

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      <Stack.Screen
        options={headerOptions({
          title: "Settings",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton={true} title="Settings" />
      <ThemeToggler />
      <Link href="/profile/account" asChild>
        <Button label="Account" variant="outline" />
      </Link>
      <View className="flex-1 pb-24">
        <Button variant="destructive" onPress={handleSignOut} label="Sign Out" />
      </View>
    </Screen>
  );
}
