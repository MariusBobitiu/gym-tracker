import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { BackgroundGradient } from '@/components/background-gradient';
import { useTheme } from '@/lib/theme-context';

type ScreenPreset = 'fixed' | 'scroll';
type PaddingPreset = 'none' | 'sm' | 'md' | 'lg';
type ScreenBackground = 'gradient' | 'none';

type ScreenProps = {
  children: React.ReactNode;
  preset?: ScreenPreset;
  padding?: PaddingPreset;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
  keyboardOffset?: number;
  background?: ScreenBackground;
  className?: string;
  contentContainerClassName?: string;
  scrollProps?: ScrollViewProps;
};

const joinClassName = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(' ');

export function Screen({
  children,
  preset = 'fixed',
  padding = 'md',
  safeAreaEdges = ['top'],
  keyboardAvoiding = false,
  keyboardOffset = 0,
  background = 'gradient',
  className,
  contentContainerClassName,
  scrollProps,
}: ScreenProps) {
  const { tokens } = useTheme();
  const containerClassName = joinClassName('flex-1', className);
  const scrollContainerClassName = joinClassName('flex-grow', contentContainerClassName);

  const paddingValue = React.useMemo(() => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return tokens.spacing.sm;
      case 'md':
        return tokens.spacing.md;
      case 'lg':
        return tokens.spacing.lg;
      default:
        return tokens.spacing.md;
    }
  }, [padding, tokens.spacing]);

  // Add extra bottom padding to avoid content being hidden behind bottom navigation
  const containerStyle = React.useMemo(
    () => ({ padding: paddingValue, paddingBottom: 64 }),
    [paddingValue]
  );

  // Add extra bottom padding to avoid content being hidden behind bottom navigation
  const scrollContentStyle = React.useMemo(
    () => ({ padding: paddingValue, paddingBottom: 64 }),
    [paddingValue]
  );

  const content =
    preset === 'scroll' ? (
      <ScrollView
        className="flex-1"
        contentContainerClassName={scrollContainerClassName}
        contentContainerStyle={[scrollContentStyle, scrollProps?.contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    ) : (
      <View className={containerClassName} style={containerStyle}>
        {children}
      </View>
    );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View className="flex-1">
      {background === 'gradient' ? <BackgroundGradient /> : null}
      <SafeAreaView edges={safeAreaEdges} className="flex-1">
        {wrappedContent}
      </SafeAreaView>
    </View>
  );
}
