import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/forms";
import { Radio, View as UIView } from "@/components/ui";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type WeightUnit,
} from "@/lib/storage";

const WEIGHT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lb", label: "Pounds (lb)" },
];

export default function UnitsSettings(): React.ReactElement {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    () => getStorageItem(STORAGE_KEYS.weightUnit) ?? "kg"
  );

  const handleWeightChange = useCallback((value: WeightUnit) => {
    setWeightUnit(value);
    setStorageItem(STORAGE_KEYS.weightUnit, value);
  }, []);

  return (
    <Screen className="pb-24">
      <Stack.Screen
        options={headerOptions({
          title: "Units",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Units" />

      <UIView className="gap-4 px-4 pt-4">
        <FormField
          label="Weight"
          helper="Used for logging sets and displaying volume (e.g. in history)."
        />
        <UIView className="gap-3">
          {WEIGHT_OPTIONS.map((option) => (
            <Radio
              key={option.value}
              checked={weightUnit === option.value}
              onChange={() => handleWeightChange(option.value)}
              label={option.label}
              accessibilityLabel={`Use ${option.label}`}
            />
          ))}
        </UIView>
      </UIView>
    </Screen>
  );
}
