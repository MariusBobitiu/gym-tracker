import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import {
  BarChart2,
  Bell,
  ClipboardList,
  type LucideIcon,
} from "lucide-react-native";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Screen } from "@/components/screen";
import { Button, P } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type Slide = {
  id: string;
  title: string;
  body: string;
  Icon: LucideIcon;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    title: "Plan your workouts",
    body: "Create a custom split with sessions and exercises. Set up A/B weeks to keep your training varied.",
    Icon: ClipboardList,
  },
  {
    id: "2",
    title: "Track your progress",
    body: "Log sets, reps and weight as you train. Your history is saved so you can see how you improve.",
    Icon: BarChart2,
  },
  {
    id: "3",
    title: "Stay consistent",
    body: "Get daily reminders and see your week at a glance. Small steps lead to big results.",
    Icon: Bell,
  },
];

const CONTENT_MAX_WIDTH = 320;

function SlideItem({
  slide,
  width,
}: {
  slide: Slide;
  width: number;
}): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { Icon } = slide;

  return (
    <View
      style={{
        width,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: tokens.spacing.xl,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: tokens.radius.xl,
          backgroundColor: `${colors.primary}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: tokens.spacing["2xl"],
        }}
      >
        <Icon size={36} color={colors.primary} strokeWidth={1.5} />
      </View>
      <View
        style={{
          alignItems: "center",
          width: "100%",
          maxWidth: CONTENT_MAX_WIDTH,
        }}
      >
        <P
          style={{
            fontSize: tokens.typography.sizes["3xl"],
            fontWeight: tokens.typography.weights.bold,
            color: colors.foreground,
            textAlign: "center",
            marginBottom: tokens.spacing.md,
            lineHeight: tokens.typography.lineHeights["3xl"],
          }}
        >
          {slide.title}
        </P>
        <P
          style={{
            fontSize: tokens.typography.sizes.md,
            color: colors.mutedForeground,
            textAlign: "center",
            lineHeight: 24,
            maxWidth: CONTENT_MAX_WIDTH,
          }}
        >
          {slide.body}
        </P>
      </View>
    </View>
  );
}

export default function OnboardingScreen(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const isLastSlide = index === SLIDES.length - 1;

  const handleComplete = useCallback(() => {
    setCompleted();
    router.replace("/(app)");
  }, [setCompleted]);

  const handleMainButtonPress = useCallback(() => {
    if (isLastSlide) {
      handleComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
      setIndex(index + 1);
    }
  }, [isLastSlide, handleComplete, index]);

  const renderItem: ListRenderItem<Slide> = useCallback(
    ({ item }) => <SlideItem slide={item} width={screenWidth} />,
    [screenWidth]
  );

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: screenWidth,
      offset: screenWidth * i,
      index: i,
    }),
    [screenWidth]
  );

  return (
    <Screen
      preset="fixed"
      padding="none"
      safeAreaEdges={["top", "bottom"]}
      className="flex-1"
    >
      <View className="flex-1 pt-12">
        <Image
          source={require("../../../assets/icon.png")}
          style={{
            width: 64,
            height: 64,
            alignSelf: "center",
            marginBottom: tokens.spacing.xl,
          }}
          contentFit="contain"
        />
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const i = Math.round(
              e.nativeEvent.contentOffset.x /
                e.nativeEvent.layoutMeasurement.width
            );
            setIndex(i);
          }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: tokens.spacing.sm,
            paddingVertical: tokens.spacing.lg,
          }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === index ? colors.primary : colors.mutedForeground + "40",
              }}
            />
          ))}
        </View>
      </View>
      <View
        style={{
          gap: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.xl,
          paddingBottom: tokens.spacing["2xl"],
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: 360, alignSelf: "center" }}>
          <Button
            label={isLastSlide ? "Get started" : "Next"}
            variant="primary"
            size="lg"
            onPress={handleMainButtonPress}
          />
        </View>
        <Pressable
          onPress={handleComplete}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <P
            style={{
              textAlign: "center",
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.sm,
              letterSpacing: tokens.typography.letterSpacing.wide,
            }}
          >
            Skip
          </P>
        </Pressable>
      </View>
    </Screen>
  );
}
