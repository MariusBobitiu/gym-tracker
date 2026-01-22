import * as React from 'react';
import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/lib/theme-context';

type TypographyProps = TextProps & {
  className?: string;
};

export function H1({ className = '', style, children, ...props }: TypographyProps) {
  const { colors, tokens } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes['4xl'],
          lineHeight: tokens.typography.lineHeights['4xl'],
          fontWeight: tokens.typography.weights.bold,
          letterSpacing: tokens.typography.letterSpacing.tight,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function H2({ className = '', style, children, ...props }: TypographyProps) {
  const { colors, tokens } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes['3xl'],
          lineHeight: tokens.typography.lineHeights['3xl'],
          fontWeight: tokens.typography.weights.semibold,
          letterSpacing: tokens.typography.letterSpacing.tight,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function H3({ className = '', style, children, ...props }: TypographyProps) {
  const { colors, tokens } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes['2xl'],
          lineHeight: tokens.typography.lineHeights['2xl'],
          fontWeight: tokens.typography.weights.semibold,
          letterSpacing: tokens.typography.letterSpacing.tight,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function P({ className = '', style, children, ...props }: TypographyProps) {
  const { colors, tokens } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        '',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes.md,
          lineHeight: tokens.typography.lineHeights.xl,
          fontWeight: tokens.typography.weights.regular,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

export function Small({ className = '', style, children, ...props }: TypographyProps) {
  const { colors, tokens } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        '',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.foreground,
          fontSize: tokens.typography.sizes.sm,
          lineHeight: tokens.typography.lineHeights.sm,
          fontWeight: tokens.typography.weights.medium,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={textStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}
