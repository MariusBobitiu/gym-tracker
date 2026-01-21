import * as React from 'react';
import { Pressable, LayoutChangeEvent } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Text, View, colors } from '@/components/ui';
import { useTheme } from '@/lib/theme-context';

type TabItem = {
  name: string;
  label: string;
  icon: (active: boolean, isDark: boolean) => React.ReactNode;
  showLabel?: boolean;
};

const tabs: TabItem[] = [
  {
    name: 'index',
    label: 'Activity',
    icon: (active, isDark) => (
      <MaterialIcons
        name="spa"
        size={24}
        color={active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000'}
      />
    ),
    showLabel: true,
  },
  {
    name: 'fitness',
    label: 'Fitness',
    icon: (active, isDark) => (
      <Ionicons
        name="fitness"
        size={24}
        color={active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000'}
      />
    ),
    showLabel: true,
  },
  {
    name: 'plans',
    label: 'Plans',
    icon: (active, isDark) => (
      <Ionicons
        name="document-text"
        size={24}
        color={active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000'}
      />
    ),
    showLabel: true,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: (active, isDark) => (
      <MaterialIcons
        name="person"
        size={24}
        color={active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000'}
      />
    ),
    showLabel: true,
  },
];

type Props = {
  className?: string;
};

export function BottomNavigation({ className = '' }: Props): React.ReactElement {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const tabPositions = React.useRef<Map<string, { x: number; width: number }>>(
    new Map()
  );
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  const isInitialized = React.useRef(false);

  function getActiveTab(): string {
    if (pathname === '/') return 'index';
    const path = pathname.replace('/', '');
    return tabs.find((tab) => path.startsWith(tab.name))?.name || 'index';
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
    if (tabName === 'index') {
      router.push('/');
    } else if (tabName === 'fitness') {
      router.push('/fitness');
    } else if (tabName === 'plans') {
      router.push('/plans');
    } else if (tabName === 'profile') {
      router.push('/profile');
    }
  }

  function handleTabLayout(
    tabName: string,
    event: LayoutChangeEvent
  ): void {
    const { x, width: tabWidth } = event.nativeEvent.layout;
    tabPositions.current.set(tabName, { x, width: tabWidth });

    // Update indicator position if this is the active tab
    if (tabName === activeTab) {
      const horizontalPadding = 8;
      const indicatorWidth = tabWidth - horizontalPadding * 2;
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
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        className={`rounded-full border overflow-hidden ${className}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
          borderColor: isDark 
            ? `rgba(255, 255, 255, 0.1)` 
            : `rgba(0, 0, 0, 0.1)`,
          backgroundColor: isDark
            ? `rgba(18, 18, 18, 0.7)`
            : `rgba(255, 255, 255, 0.7)`,
        }}
      >
        <View className="flex-row items-center relative px-2 py-1">
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 4,
                bottom: 4,
                backgroundColor: isDark ? '#ffffff20' : '#00000020',
                borderRadius: 9999,
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
                className="items-center justify-center z-10"
                style={{ flex: 1 }}
              >
                <View className="items-center justify-center p-3">
                  {tab.icon(isActive, isDark)}
                  {tab.showLabel && (
                    <Text
                      className={`mt-1 text-xs font-medium ${
                        isActive ? 'text-white' : 'text-foreground'
                      }`}
                    >
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
