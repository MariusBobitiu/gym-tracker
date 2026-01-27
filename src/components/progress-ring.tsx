import * as React from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number;
  size: number;
  strokeWidth: number;
  trackOpacity?: number;
  showCenterText?: boolean;
  label?: string;
  subLabel?: string;
  icon?: React.ReactNode;
};

function clampValue(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ProgressRing({
  value,
  size,
  strokeWidth,
  trackOpacity = 0.15,
  showCenterText = true,
  label,
  subLabel,
  icon,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: clampValue(value),
      duration: 2400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View className="items-center justify-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.muted}
            strokeOpacity={trackOpacity}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
        {showCenterText ? (
          <View className="absolute inset-0 items-center justify-center">
            {icon ? <View className="mb-1">{icon}</View> : null}
            {label ? (
              <Text className="font-inter font-semibold" style={{ color: colors.foreground }}>
                {label}
              </Text>
            ) : null}
            {subLabel ? (
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {subLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
