import * as React from "react";
import { Pressable, LayoutChangeEvent, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { CalendarClock, Dumbbell, Notebook, User } from "lucide-react-native";

import { Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type TabItem = {
  name: string;
  label: string;
  icon: (active: boolean, isDark: boolean) => React.ReactNode;
  showLabel?: boolean;
};

const tabs: TabItem[] = [
  {
    name: "index",
    label: "Today",
    icon: (active, isDark) => (
      <Dumbbell size={20} color={active ? "#ffa90a" : isDark ? "#FFFFFF" : "#000000"} />
    ),
    showLabel: true,
  },
  {
    name: "planner",
    label: "Planner",
    icon: (active, isDark) => (
      <Notebook size={20} color={active ? "#ffa90a" : isDark ? "#FFFFFF" : "#000000"} />
    ),
    showLabel: true,
  },
  {
    name: "history",
    label: "History",
    icon: (active, isDark) => (
      <CalendarClock size={20} color={active ? "#ffa90a" : isDark ? "#FFFFFF" : "#000000"} />
    ),
    showLabel: true,
  },
  {
    name: "profile",
    label: "Profile",
    icon: (active, isDark) => (
      <User size={20} color={active ? "#ffa90a" : isDark ? "#FFFFFF" : "#000000"} />
    ),
    showLabel: true,
  },
];

type Props = {
  className?: string;
};

export function BottomNavigation({ className = "" }: Props): React.ReactElement {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const tabPositions = React.useRef<Map<string, { x: number; width: number }>>(new Map());
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  const isInitialized = React.useRef(false);

  function getActiveTab(): string {
    if (pathname === "/") return "index";
    const path = pathname.replace("/", "");
    return tabs.find((tab) => path.startsWith(tab.name))?.name || "index";
  }

  const activeTab = getActiveTab();

  React.useEffect(() => {
    const position = tabPositions.current.get(activeTab);
    if (position) {
      // Use the Pressable's width (which is 1/4 of the container) with small padding
      const horizontalPadding = 0;
      const indicatorWidth = position.width - horizontalPadding * 2;
      const leftPosition = position.x + horizontalPadding;

      if (isInitialized.current) {
        translateX.value = withTiming(leftPosition, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        width.value = withTiming(indicatorWidth, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        translateX.value = leftPosition;
        width.value = indicatorWidth;
        isInitialized.current = true;
      }
    }
  }, [activeTab, translateX, width]);

  function handlePress(tabName: string): void {
    if (tabName === "index") {
      router.push("/");
    } else if (tabName === "planner") {
      router.push("/planner");
    } else if (tabName === "history") {
      router.push("/history");
    } else if (tabName === "profile") {
      router.push("/profile");
    }
  }

  function handleTabLayout(tabName: string, event: LayoutChangeEvent): void {
    const { x, width: tabWidth } = event.nativeEvent.layout;
    tabPositions.current.set(tabName, { x, width: tabWidth });

    // Update indicator position if this is the active tab
    if (tabName === activeTab) {
      const horizontalPadding = 0;
      const indicatorWidth = tabWidth;
      const leftPosition = x + horizontalPadding;

      if (isInitialized.current) {
        translateX.value = withTiming(leftPosition, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        width.value = withTiming(indicatorWidth, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        translateX.value = leftPosition;
        width.value = indicatorWidth;
        isInitialized.current = true;
      }
    }
  }

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: width.value,
    };
  });

  return (
    <View className="absolute bottom-6 left-0 right-0 px-4">
      <BlurView
        intensity={15}
        tint={Platform.OS === "ios" ? "systemMaterial" : "dark"}
        className={`overflow-hidden rounded-full border-[0.6px] ${className}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
          borderColor: isDark ? `${colors.border}90` : `${colors.border}70`,
          backgroundColor: isDark ? `${colors.background}95` : `${colors.background}95`,
        }}>
        <View className="relative flex-row items-center px-2 py-1">
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 4,
                bottom: 4,
                backgroundColor: `${colors.foreground}10`,
                borderRadius: 9999,
                borderWidth: 0.6,
                borderColor: `${colors.border}30`,
              },
              animatedBackgroundStyle,
            ]}
          />
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;

            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress(tab.name)}
                onLayout={(event) => handleTabLayout(tab.name, event)}
                className="z-10 items-center justify-center"
                style={{ flex: 1 }}>
                <View className="items-center justify-center p-2">
                  {tab.icon(isActive, isDark)}
                  {tab.showLabel && (
                    <Text
                      style={{
                        color: isActive ? "#ffa90a" : isDark ? "#FFFFFF" : "#000000",
                        fontSize: 12,
                        fontWeight: isActive ? "600" : "400",
                      }}>
                      {tab.label}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
