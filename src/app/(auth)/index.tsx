import { View } from "react-native";

import { Dumbbell } from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import { Button, H1, P } from "@/components/ui";
import { router } from "expo-router";
import { Screen } from "@/components/screen";

export default function SignIn() {
  const { colors } = useTheme();
  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      className="flex items-center justify-center pb-16"
    >
      <View className="flex-1 items-center justify-center">
        <Dumbbell
          size={96}
          color={colors.primary}
          style={{ marginBottom: 12 }}
          className="rotate-45"
        />
        <H1 style={{ fontSize: 48, lineHeight: 56 }}>Welcome</H1>
        <P
          className="px-4 text-center"
          style={{ fontSize: 24, color: colors.mutedForeground }}
        >
          Plan and track your workouts like never before.
        </P>
      </View>
      {/* <View style={{ height: 64 }} /> */}
      <Button
        size="lg"
        variant="primary"
        className="w-full"
        onPress={() => router.push("/(auth)/sign-up")}
        label="Create Account"
      />
      <Button
        size="lg"
        // variant="primary"
        className="w-full"
        onPress={() => router.push("/(auth)/sign-in")}
        label="Sign In"
      />
      <View className="mt-3 w-full flex-row items-center justify-center px-16">
        <View
          className="h-px w-1/2"
          style={{ backgroundColor: colors.foreground, opacity: 0.2 }}
        />
        <P
          className="z-10 px-4 text-center"
          style={{ color: colors.mutedForeground, fontWeight: "600" }}
        >
          OR
        </P>
        <View
          className="h-px w-1/2"
          style={{ backgroundColor: colors.foreground, opacity: 0.2 }}
        />
      </View>
      <Button
        size="lg"
        variant="secondary"
        className="mt-3 w-full"
        // onPress={() => router.push("/onboarding")}
        label="Sign in with Apple (Coming Soon)"
      />
    </Screen>
  );
}
