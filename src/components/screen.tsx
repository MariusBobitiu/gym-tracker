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

const paddingPresets: Record<PaddingPreset, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
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
  const paddingClassName = paddingPresets[padding];
  const containerClassName = joinClassName('flex-1', paddingClassName, className);
  const scrollContainerClassName = joinClassName(
    'flex-grow',
    paddingClassName,
    contentContainerClassName
  );

  const content =
    preset === 'scroll' ? (
      <ScrollView
        className="flex-1"
        contentContainerClassName={scrollContainerClassName}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    ) : (
      <View className={containerClassName}>{children}</View>
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
