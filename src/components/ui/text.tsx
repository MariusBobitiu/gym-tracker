import React from 'react';
import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text as NNText } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/lib/theme-context';

interface Props extends TextProps {
  className?: string;
}

export const Text = ({
  className = '',
  style,
  children,
  ...props
}: Props) => {
  const { colors } = useTheme();
  
  const textStyle = React.useMemo(
    () =>
      twMerge(
        'text-base font-inter font-normal',
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
    <NNText className={textStyle} style={nStyle} {...props}>
      {children}
    </NNText>
  );
};
