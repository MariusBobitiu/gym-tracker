import * as React from 'react';
import type { TextProps, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { StyleSheet, Text as RNText, View as RNView } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/lib/theme-context';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = '', style, children, ...props }: CardProps) {
  const { colors, tokens } = useTheme();
  
  const cardStyle = React.useMemo(
    () =>
      twMerge(
        'border shadow-sm',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.md,
        },
        style,
      ]) as ViewStyle,
    [style, colors, tokens]
  );

  return (
    <RNView className={cardStyle} style={nStyle} {...props}>
      {children}
    </RNView>
  );
}

type CardHeaderProps = ViewProps & {
  className?: string;
};

export function CardHeader({ className = '', style, children, ...props }: CardHeaderProps) {
  const { tokens } = useTheme();
  const headerStyle = React.useMemo(
    () =>
      twMerge(
        'flex flex-col space-y-1.5',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          padding: tokens.spacing.sm,
        },
        style,
      ]) as ViewStyle,
    [style, tokens]
  );

  return (
    <RNView className={headerStyle} style={nStyle} {...props}>
      {children}
    </RNView>
  );
}

type CardTitleProps = TextProps & {
  className?: string;
};

export function CardTitle({ className = '', style, children, ...props }: CardTitleProps) {
  const { colors, tokens } = useTheme();
  
  const titleStyle = React.useMemo(
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
          color: colors.cardForeground,
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
    <RNText className={titleStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

type CardDescriptionProps = TextProps & {
  className?: string;
};

export function CardDescription({ className = '', style, children, ...props }: CardDescriptionProps) {
  const { colors, tokens } = useTheme();
  
  const descriptionStyle = React.useMemo(
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
          color: colors.mutedForeground,
          fontSize: tokens.typography.sizes.sm,
          lineHeight: tokens.typography.lineHeights.sm,
          fontWeight: tokens.typography.weights.regular,
        },
        style,
      ]) as TextStyle,
    [style, colors, tokens]
  );

  return (
    <RNText className={descriptionStyle} style={nStyle} {...props}>
      {children}
    </RNText>
  );
}

type CardContentProps = ViewProps & {
  className?: string;
};

export function CardContent({ className = '', style, children, ...props }: CardContentProps) {
  const { tokens } = useTheme();
  const contentStyle = React.useMemo(
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
          padding: tokens.spacing.sm,
        },
        style,
      ]) as ViewStyle,
    [style, tokens]
  );

  return (
    <RNView className={contentStyle} style={nStyle} {...props}>
      {children}
    </RNView>
  );
}

type CardFooterProps = ViewProps & {
  className?: string;
};

export function CardFooter({ className = '', style, children, ...props }: CardFooterProps) {
  const footerStyle = React.useMemo(
    () =>
      twMerge(
        'flex flex-row items-center',
        className
      ),
    [className]
  );

  return (
    <RNView className={footerStyle} style={style} {...props}>
      {children}
    </RNView>
  );
}
