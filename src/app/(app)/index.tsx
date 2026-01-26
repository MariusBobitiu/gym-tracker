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
        <ScrollView contentContainerClassName="pb-24">
          <Card
            className={`${isDark ? "shadow-[0_0_10px_0_rgba(0,0,0,0.8)]" : "shadow-[0_0_5px_0_rgba(0,0,0,0.15)]"}`}>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <P>Typography components</P>
              <H2>H2</H2>
              <H3>H3</H3>
              <P>P</P>
              <Small>Small</Small>
            </CardContent>
          </Card>

          <ScrollView className="mt-4 flex-1" contentContainerClassName="flex-1">
            <Buttons />
          </ScrollView>
          <Button
            onPress={() => {
              signOut();
            }}
            label="Sign Out"
            className="mt-4"
          />
        </ScrollView>
      </Screen>
    </>
  );
}
