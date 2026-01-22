import * as React from 'react';
import type { TextProps, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { StyleSheet, Text as RNText, View as RNView } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/lib/theme-context';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = '', style, children, ...props }: CardProps) {
  const { colors } = useTheme();
  
  const cardStyle = React.useMemo(
    () =>
      twMerge(
        'rounded-lg border bg-card shadow-sm',
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
        },
        style,
      ]) as ViewStyle,
    [style, colors]
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
  const headerStyle = React.useMemo(
    () =>
      twMerge(
        'flex flex-col space-y-1.5 p-6',
        className
      ),
    [className]
  );

  return (
    <RNView className={headerStyle} style={style} {...props}>
      {children}
    </RNView>
  );
}

type CardTitleProps = TextProps & {
  className?: string;
};

export function CardTitle({ className = '', style, children, ...props }: CardTitleProps) {
  const { colors } = useTheme();
  
  const titleStyle = React.useMemo(
    () =>
      twMerge(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.cardForeground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
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
  const { colors } = useTheme();
  
  const descriptionStyle = React.useMemo(
    () =>
      twMerge(
        'text-sm',
        className
      ),
    [className]
  );

  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        {
          color: colors.mutedForeground,
        },
        style,
      ]) as TextStyle,
    [style, colors]
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
  const contentStyle = React.useMemo(
    () =>
      twMerge(
        'p-6 pt-0',
        className
      ),
    [className]
  );

  return (
    <RNView className={contentStyle} style={style} {...props}>
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
        'flex flex-row items-center p-6 pt-0',
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
