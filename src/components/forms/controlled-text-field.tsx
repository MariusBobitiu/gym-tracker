import React from "react";
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { useController } from "react-hook-form";

import { Input, type NInputProps } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";

export type ControlledTextFieldProps<T extends FieldValues> = Omit<
  NInputProps,
  "value" | "onChangeText" | "onBlur" | "label" | "error"
> & {
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
  helper?: string;
  required?: boolean;
};

export function ControlledTextField<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  helper,
  required,
  ...inputProps
}: ControlledTextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name, rules });

  return (
    <FormField
      label={label}
      helper={helper}
      required={required}
      error={fieldState.error?.message}
    >
      <Input
        ref={field.ref}
        value={(field.value as string) ?? ""}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        autoCapitalize="none"
        hideError
        {...inputProps}
      />
    </FormField>
  );
}
