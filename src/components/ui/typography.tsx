import * as React from 'react';
import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/lib/theme-context';

type TypographyProps = TextProps & {
  className?: string;
};

export function H1({ className = '', style, children, ...props }: TypographyProps) {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-4xl font-bold tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function H2({ className = '', style, children, ...props }: TypographyProps) {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-3xl font-semibold tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function H3({ className = '', style, children, ...props }: TypographyProps) {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-2xl font-semibold tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function P({ className = '', style, children, ...props }: TypographyProps) {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-base leading-7',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function Small({ className = '', style, children, ...props }: TypographyProps) {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-sm font-medium leading-none',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}
