import React from "react";
import { Screen } from "@/components/screen";
import { Button, Card, H1, H2, P, Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { Stack } from "expo-router";
import { cn } from "@/lib/cn";
import { ChevronRight } from "lucide-react-native";
import { BackgroundGradient } from "@/components/background-gradient";
import { AmbientBackground, NoiseOverlay } from "@/components/ambient-background";

export default function Workout() {
  const { colors, tokens } = useTheme();

  const exercises = [
    { name: "Bench Press", sets: 3, reps: 10, weight: 100, isActive: true },
    { name: "Squats", sets: 3, reps: 10, weight: 100 },
    { name: "Deadlifts", sets: 3, reps: 10, weight: 100 },
    { name: "Overhead Press", sets: 3, reps: 10, weight: 100 },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
        }}
      />
      <Screen
        preset="modal"
        background="gradient"
        safeAreaEdges={["bottom"]}
        contentContainerClassName="flex-1 px-4 pt-8">
        <BackgroundGradient />
        <View>
          <H2 style={{ color: colors.primary }}>Workout</H2>
          <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>00:18 elapsed</P>
        </View>
        <View className="mt-12">
          <H1>Bench Press</H1>
          <P style={{ color: colors.mutedForeground, opacity: 0.8 }}>Set 1 of 3</P>
        </View>
        <View className="flex-1">
          <Card className="mt-16" style={{ padding: 0 }}>
            {exercises.map((item, index) => (
              <View
                key={index}
                className={cn(
                  "flex-row items-center justify-normal gap-6 p-4",
                  index === 0 && "rounded-t-lg",
                  index === exercises.length - 1 && "rounded-b-lg",
                  index !== 0 && "border-t"
                )}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                {item.isActive ? (
                  <View
                    className="size-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                ) : (
                  <View
                    className="size-3 rounded-full"
                    style={{ backgroundColor: colors.mutedForeground, opacity: 0.2 }}
                  />
                )}
                <Text
                  style={{ color: colors.foreground, fontWeight: tokens.typography.weights.bold }}>
                  {item.name}
                </Text>
                <View className="flex-1 flex-row items-center justify-end gap-2">
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      opacity: 0.8,
                      fontSize: tokens.typography.sizes.sm,
                    }}>
                    {item.sets} sets
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      opacity: 0.8,
                      fontSize: tokens.typography.sizes.sm,
                    }}>
                    {item.reps} reps
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      opacity: 0.8,
                      fontSize: tokens.typography.sizes.sm,
                    }}>
                    {item.weight} lbs
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </View>
            ))}
          </Card>
        </View>
        <View className="mb-4 border-t-2 py-4" style={{ borderColor: colors.border }}>
          <Button
            label="Continue"
            variant="primary"
            size="lg"
            icon={
              <ChevronRight size={24} className="mt-[0.25px]" color={colors.primaryForeground} />
            }
            iconPlacement="right"
          />
        </View>
      </Screen>
    </>
  );
}
