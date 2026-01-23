import React from "react";
import type { Control, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";

import { Select, type SelectProps } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";

export type ControlledSelectFieldProps<T extends FieldValues> = Omit<
  SelectProps,
  "value" | "onSelect" | "label" | "error"
> & {
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
  helper?: string;
  required?: boolean;
  onSelect?: (value: string | number) => void;
};

export function ControlledSelectField<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  helper,
  required,
  onSelect,
  ...selectProps
}: ControlledSelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name, rules });

  const handleSelect = React.useCallback(
    (value: string | number) => {
      field.onChange(value);
      onSelect?.(value);
    },
    [field, onSelect]
  );

  return (
    <FormField label={label} helper={helper} required={required} error={fieldState.error?.message}>
      <Select
        value={field.value as string | number | undefined}
        onSelect={handleSelect}
        hideError
        {...selectProps}
      />
    </FormField>
  );
}
