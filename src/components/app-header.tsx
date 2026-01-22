import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { H2 } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { View } from 'react-native';
import { useTheme } from '@/lib/theme-context';

const BackButton = () => {
  const { colors } = useTheme();

  return (
    <Button
      onPress={() => router.back()}
      variant="link"
      icon={<Ionicons name="chevron-back" size={32} color={colors.foreground} />}
      style={{
        backgroundColor: `${colors.card.toString()}20`,
        borderRadius: 100,
        padding: 4,
        width: 44,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
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
  showBackButton?: boolean;
  className?: string;
};

const AppHeader = ({
  title,
  left,
  right,
  showBackButton = true,
  className,
}: AppHeaderProps) => {
  const resolvedTitle =
    typeof title === 'string' ? <H2>{title}</H2> : title;

  return (
    <View className={`flex-row items-center -mt-4 mb-2 ${className ?? ''}`}>
      <View className="flex-1 items-start">
        {left ?? (showBackButton ? <BackButton /> : null)}
      </View>
      <View className="flex-[2] items-center">
        {resolvedTitle ?? null}
      </View>
      <View className="flex-1 items-end">{right ?? null}</View>
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
