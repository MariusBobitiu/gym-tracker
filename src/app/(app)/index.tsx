import { Stack } from "expo-router";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  H1,
  H2,
  H3,
  P,
  ScrollView,
  Small,
} from "@/components/ui";
import { Buttons } from "@/components/buttons";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { useAuth } from "@/lib/auth/context";
import { useTheme } from "@/lib/theme-context";

export default function Home() {
  const { signOut } = useAuth();
  const { isDark } = useTheme();
  return (
    <>
      <Screen>
        <AppHeader showBackButton={false} title="Home" isMainScreen />
        <Stack.Screen options={headerOptions({ title: "Home" })} />
      </Screen>
    </>
  );
}
