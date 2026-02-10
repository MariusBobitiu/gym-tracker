/**
 * Weight unit helpers. All stored values are in kg; convert to/from for display.
 */

import type { WeightUnit } from "@/lib/storage";

export const KG_TO_LB = 2.20462262185;

/** Convert kg to display value in user unit. */
export function fromKg(kg: number, unit: WeightUnit): number {
  if (unit === "lb") return kg * KG_TO_LB;
  return kg;
}

/** Convert user-unit value to kg for storage. */
export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "lb") return value / KG_TO_LB;
  return value;
}

/** Format a single weight for display (e.g. "20 kg" or "44.1 lb"). */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const value = fromKg(kg, unit);
  const decimals = value % 1 === 0 ? 0 : 1;
  const suffix = unit === "lb" ? " lb" : " kg";
  return `${value.toLocaleString("en-GB", { maximumFractionDigits: decimals })}${suffix}`;
}

/** Format volume (kg) for display; uses unit for suffix. */
export function formatVolume(
  totalKg: number | null | undefined,
  unit: WeightUnit
): string {
  if (!totalKg || totalKg <= 0) return "—";
  const value = fromKg(totalKg, unit);
  const suffix = unit === "lb" ? " lb" : " kg";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k${suffix}`;
  return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}${suffix}`;
}

/** Unit label for forms (e.g. "kg" or "lb"). */
export function weightUnitLabel(unit: WeightUnit): string {
  return unit === "lb" ? "lb" : "kg";
}
