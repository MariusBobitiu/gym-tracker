import * as React from "react";
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { useController } from "react-hook-form";
import type { TextInputProps } from "react-native";
import { StyleSheet, View, TextInput as NTextInput } from "react-native";
import { tv } from "tailwind-variants";

import colors from "./colors";
import { useTheme } from "@/lib/theme-context";
import { Text } from "./text";

const inputTv = tv({
  slots: {
    container: "mb-2",
    label: "text-grey-100 mb-1 text-lg",
    input:
      "mt-0 rounded-xl border-[0.5px] border-neutral-300 bg-neutral-100 px-4 py-3 font-inter text-base  font-medium leading-5",
  },

  variants: {
    focused: {
      true: {
        input: "border-neutral-400",
      },
    },
    error: {
      true: {
        input: "border-danger-600",
        label: "text-danger-600",
      },
    },
    disabled: {
      true: {
        input: "bg-neutral-200",
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
  },
});

export interface NInputProps extends TextInputProps {
  label?: string;
  disabled?: boolean;
  error?: string;
  hideError?: boolean;
}

type TRule<T extends FieldValues> =
  | Omit<
      RegisterOptions<T>,
      "disabled" | "valueAsNumber" | "valueAsDate" | "setValueAs"
    >
  | undefined;

export type RuleType<T extends FieldValues> = { [name in keyof T]: TRule<T> };
export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: RuleType<T>;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps, InputControllerType<T> {}

export const Input = React.forwardRef<NTextInput, NInputProps>((props, ref) => {
  const { label, error, hideError, testID, ...inputProps } = props;
  const { colors: themeColors, tokens } = useTheme();
  const [isFocussed, setIsFocussed] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocussed(false), []);
  const onFocus = React.useCallback(() => setIsFocussed(true), []);

  const styles = React.useMemo(
    () =>
      inputTv({
        error: Boolean(error),
        focused: isFocussed,
        disabled: Boolean(props.disabled),
      }),
    [error, isFocussed, props.disabled]
  );

  const inputStyle = React.useMemo(() => {
    const paddingVertical = tokens.spacing.md;
    const fontSize = tokens.typography.sizes.md;
    const isMultiline = Boolean(inputProps.multiline);
    const lineHeight = tokens.typography.lineHeights.md;
    const singleLineHeight = 48;
    const minHeight = isMultiline
      ? lineHeight + paddingVertical * 2
      : singleLineHeight;
    const baseStyle: Record<string, unknown> = {
      backgroundColor: themeColors.input,
      borderRadius: tokens.radius.md,
      borderColor: isFocussed
        ? themeColors.ring
        : error
          ? themeColors.destructive
          : themeColors.border,
      color: themeColors.foreground,
      fontSize,
      fontWeight: tokens.typography.weights.medium,
      paddingHorizontal: tokens.spacing.md,
      minHeight,
    };
    if (isMultiline) {
      baseStyle.paddingVertical = paddingVertical;
      baseStyle.lineHeight = lineHeight;
    } else {
      baseStyle.height = singleLineHeight;
      baseStyle.textAlignVertical = "center";
      baseStyle.paddingTop = paddingVertical + 2;
      baseStyle.paddingBottom = paddingVertical - 2;
    }
    return StyleSheet.flatten([baseStyle, inputProps.style]);
  }, [
    isFocussed,
    error,
    themeColors,
    inputProps.style,
    inputProps.multiline,
    tokens,
  ]);

  return (
    <View className={styles.container()}>
      {label && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label()}
          style={{
            color: error ? themeColors.destructive : themeColors.foreground,
            fontSize: tokens.typography.sizes.md,
            lineHeight: tokens.typography.lineHeights.md,
            fontWeight: tokens.typography.weights.medium,
          }}
        >
          {label}
        </Text>
      )}
      <NTextInput
        testID={testID}
        ref={ref}
        placeholderTextColor={colors.neutral[400]}
        className={styles.input()}
        onBlur={onBlur}
        onFocus={onFocus}
        includeFontPadding={false}
        {...inputProps}
        style={inputStyle}
      />
      {error && !hideError && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          className="text-sm"
          style={{
            color: themeColors.destructive,
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

// only used with react-hook-form
export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
  const { name, control, rules, ...inputProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  return (
    <Input
      ref={field.ref}
      autoCapitalize="none"
      onChangeText={field.onChange}
      value={(field.value as string) || ""}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
