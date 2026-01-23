import React from "react";
import type { Control, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";

import { Checkbox, type RootProps } from "@/components/ui/checkbox";
import { FormField } from "@/components/forms/form-field";

export type ControlledCheckboxFieldProps<T extends FieldValues> = Omit<
  RootProps,
  "checked" | "onChange" | "accessibilityLabel"
> & {
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
  checkboxLabel?: string;
  helper?: string;
  required?: boolean;
  accessibilityLabel?: string;
};

export function ControlledCheckboxField<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  checkboxLabel,
  helper,
  required,
  accessibilityLabel,
  ...checkboxProps
}: ControlledCheckboxFieldProps<T>) {
  const { field, fieldState } = useController({ control, name, rules });
  const a11yLabel = accessibilityLabel ?? checkboxLabel ?? label ?? String(name);

  return (
    <FormField label={label} helper={helper} required={required} error={fieldState.error?.message}>
      <Checkbox
        checked={Boolean(field.value)}
        onChange={field.onChange}
        accessibilityLabel={a11yLabel}
        label={checkboxLabel}
        {...checkboxProps}
      />
    </FormField>
  );
}
