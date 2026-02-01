import { router } from "expo-router";
import React from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { H2, P } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { View } from "react-native";
import { useTheme } from "@/lib/theme-context";
import { Bell, ChevronLeft, Settings } from "lucide-react-native";
import { cn } from "@/lib/cn";

const BackButton = () => {
  const { colors } = useTheme();

  return (
    <Button
      onPress={() => router.back()}
      variant="link"
      icon={<ChevronLeft color={colors.foreground} />}
      style={{
        backgroundColor: `${colors.card.toString()}20`,
        borderRadius: 100,
        padding: 4,
        width: 44,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
        backdropFilter: "blur(10px)",
        boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        elevation: 10,
      }}
      className="p-0"
    />
  );
};

type AppHeaderProps = {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  rightAddon?: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
  isMainScreen?: boolean;
};

const AppHeader = ({
  title,
  left,
  right,
  rightAddon,
  showBackButton = true,
  className,
  isMainScreen = false,
}: AppHeaderProps) => {
  const { colors } = useTheme();
  const resolvedTitle =
    typeof title === "string" ? (
      <P style={{ fontSize: 20, fontWeight: "600" }}>{title}</P>
    ) : (
      title
    );

  const rightContent = isMainScreen ? (
    <View className="flex-row items-center gap-2">
      {rightAddon ?? null}
      <Button
        variant="link"
        icon={<Bell color={colors.foreground} />}
        className="p-0"
        size="icon"
      />
      <Button
        variant="link"
        icon={<Settings color={colors.foreground} />}
        className="p-0"
        size="icon"
        onPress={() => router.push("/(app)/settings")}
      />
    </View>
  ) : (
    (right ?? null)
  );

  return (
    <View className={`-mt-4 mb-2 flex-row items-center ${className ?? ""}`}>
      {left ? (
        <View className="flex-1 items-start">{left}</View>
      ) : showBackButton ? (
        <View className="flex-1 items-start">
          <BackButton />
        </View>
      ) : null}
      <View
        className={cn("flex-[2]", left || showBackButton ? "items-center" : "")}
      >
        {resolvedTitle ?? null}
      </View>
      <View className="flex-1 items-end">{rightContent}</View>
    </View>
  );
};

export const headerOptions = (
  options: NativeStackNavigationOptions = {}
): NativeStackNavigationOptions => ({
  headerShown: false,
  ...options,
});

export default AppHeader;
