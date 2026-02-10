import { getStorageItem, STORAGE_KEYS, type WeightUnit } from "@/lib/storage";
import {
  formatVolume as formatVolumeWithUnit,
  formatWeight,
  fromKg as fromKgWithUnit,
  toKg as toKgWithUnit,
  weightUnitLabel,
} from "@/lib/weight-units";

export function useWeightUnit(): {
  weightUnit: WeightUnit;
  formatWeight: (kg: number) => string;
  formatVolume: (totalKg: number | null | undefined) => string;
  fromKg: (kg: number) => number;
  toKg: (value: number) => number;
  weightUnitLabel: string;
} {
  const weightUnit = getStorageItem(STORAGE_KEYS.weightUnit) ?? "kg";
  return {
    weightUnit,
    formatWeight: (kg: number) => formatWeight(kg, weightUnit),
    formatVolume: (totalKg: number | null | undefined) =>
      formatVolumeWithUnit(totalKg, weightUnit),
    fromKg: (kg: number) => fromKgWithUnit(kg, weightUnit),
    toKg: (value: number) => toKgWithUnit(value, weightUnit),
    weightUnitLabel: weightUnitLabel(weightUnit),
  };
}
