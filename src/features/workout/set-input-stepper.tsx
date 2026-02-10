import React, { useCallback, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { triggerHaptic } from "@/lib/haptics";
import { getHitSlop } from "@/lib/accessibility";
import { cn } from "@/lib/cn";
import { WheelPickerModal } from "./wheel-picker-modal";

const HOLD_DELAY_MS = 1400; // 1.4 seconds before hold starts
const INITIAL_INTERVAL_MS = 220;
const MIN_INTERVAL_MS = 55;
const INTERVAL_DECAY = 0.92;
const TICKS_BEFORE_ACCELERATE = 2;

type SetInputStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
  pickerTitle?: string;
};

export function SetInputStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className,
  pickerTitle,
}: SetInputStepperProps): React.ReactElement {
  const { colors, tokens } = useTheme();
  const hitSlop = getHitSlop();
  const [pickerVisible, setPickerVisible] = useState(false);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickCountRef = useRef(0);
  const currentIntervalRef = useRef(INITIAL_INTERVAL_MS);
  const valueRef = useRef(value);
  const isHoldingRef = useRef(false); // Track if we're in hold mode (after 2s)
  const pressStartTimeRef = useRef<number | null>(null); // Track when press started
  valueRef.current = value;

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearTimeout(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    tickCountRef.current = 0;
    currentIntervalRef.current = INITIAL_INTERVAL_MS;
    isHoldingRef.current = false;
    pressStartTimeRef.current = null;
  }, []);

  const runDecrement = useCallback(() => {
    const current = valueRef.current;
    const next = Math.max(min, current - step);
    if (next !== current) {
      triggerHaptic("light");
      valueRef.current = next;
      onChange(next);
    }
  }, [min, step, onChange]);

  const runIncrement = useCallback(() => {
    const current = valueRef.current;
    const next = Math.min(max, current + step);
    if (next !== current) {
      triggerHaptic("light");
      valueRef.current = next;
      onChange(next);
    }
  }, [max, step, onChange]);

  const startHoldDecrement = useCallback(() => {
    if (value <= min) return;
    clearHold(); // Clear any existing hold first
    pressStartTimeRef.current = Date.now();
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      isHoldingRef.current = true; // Mark as holding - prevents onPress from firing
      tickCountRef.current = 0;
      currentIntervalRef.current = INITIAL_INTERVAL_MS;
      runDecrement();

      const run = () => {
        runDecrement();
        tickCountRef.current += 1;
        if (tickCountRef.current >= TICKS_BEFORE_ACCELERATE) {
          currentIntervalRef.current = Math.max(
            MIN_INTERVAL_MS,
            currentIntervalRef.current * INTERVAL_DECAY
          );
        }
        holdIntervalRef.current = setTimeout(run, currentIntervalRef.current);
      };
      holdIntervalRef.current = setTimeout(run, currentIntervalRef.current);
    }, HOLD_DELAY_MS);
  }, [min, value, runDecrement, clearHold]);

  const startHoldIncrement = useCallback(() => {
    if (value >= max) return;
    clearHold(); // Clear any existing hold first
    pressStartTimeRef.current = Date.now();
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      isHoldingRef.current = true; // Mark as holding - prevents onPress from firing
      tickCountRef.current = 0;
      currentIntervalRef.current = INITIAL_INTERVAL_MS;
      runIncrement();

      const run = () => {
        runIncrement();
        tickCountRef.current += 1;
        if (tickCountRef.current >= TICKS_BEFORE_ACCELERATE) {
          currentIntervalRef.current = Math.max(
            MIN_INTERVAL_MS,
            currentIntervalRef.current * INTERVAL_DECAY
          );
        }
        holdIntervalRef.current = setTimeout(run, currentIntervalRef.current);
      };
      holdIntervalRef.current = setTimeout(run, currentIntervalRef.current);
    }, HOLD_DELAY_MS);
  }, [max, value, runIncrement, clearHold]);

  const handleDecrementPressIn = useCallback(() => {
    clearHold(); // Clear any existing hold/timeout first
    startHoldDecrement();
  }, [startHoldDecrement, clearHold]);

  const handleDecrementPressOut = useCallback(() => {
    const pressDuration = pressStartTimeRef.current
      ? Date.now() - pressStartTimeRef.current
      : 0;
    const wasHolding = isHoldingRef.current || pressDuration >= HOLD_DELAY_MS;
    clearHold();
    // If we were holding, mark it so onPress doesn't fire
    if (wasHolding) {
      isHoldingRef.current = true;
    }
  }, [clearHold]);

  const handleIncrementPressIn = useCallback(() => {
    clearHold(); // Clear any existing hold/timeout first
    startHoldIncrement();
  }, [startHoldIncrement, clearHold]);

  const handleIncrementPressOut = useCallback(() => {
    const pressDuration = pressStartTimeRef.current
      ? Date.now() - pressStartTimeRef.current
      : 0;
    const wasHolding = isHoldingRef.current || pressDuration >= HOLD_DELAY_MS;
    clearHold();
    // If we were holding, mark it so onPress doesn't fire
    if (wasHolding) {
      isHoldingRef.current = true;
    }
  }, [clearHold]);

  const handleDecrementPress = useCallback(() => {
    // Don't fire if we were holding (after 2s) - the interval already handled increments
    if (isHoldingRef.current) {
      isHoldingRef.current = false; // Reset for next press
      return;
    }
    // This was a quick tap (< 2s) - fire the increment
    const next = Math.max(min, value - step);
    if (next !== value) {
      triggerHaptic("light");
      onChange(next);
    }
  }, [min, value, step, onChange]);

  const handleIncrementPress = useCallback(() => {
    // Don't fire if we were holding (after 2s) - the interval already handled increments
    if (isHoldingRef.current) {
      isHoldingRef.current = false; // Reset for next press
      return;
    }
    // This was a quick tap (< 2s) - fire the increment
    const next = Math.min(max, value + step);
    if (next !== value) {
      triggerHaptic("light");
      onChange(next);
    }
  }, [max, value, step, onChange]);

  const handleValuePress = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const handlePickerSelect = useCallback(
    (v: number) => {
      onChange(v);
    },
    [onChange]
  );

  const handlePickerDismiss = useCallback(() => {
    setPickerVisible(false);
  }, []);

  return (
    <>
      <View
        className={cn("flex-row items-center justify-center gap-4", className)}
      >
        <Pressable
          onPress={handleDecrementPress}
          onPressIn={handleDecrementPressIn}
          onPressOut={handleDecrementPressOut}
          disabled={value <= min}
          hitSlop={hitSlop}
          accessibilityLabel="Decrease value"
          accessibilityRole="button"
          className="items-center justify-center rounded-xl border p-3"
          style={{
            borderColor: colors.primary,
            backgroundColor: colors.card,
            opacity: value <= min ? 0.5 : 1,
          }}
        >
          <Minus size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={handleValuePress}
          hitSlop={hitSlop}
          accessibilityLabel="Select value"
          accessibilityRole="button"
          className="min-w-[56px] items-center"
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: tokens.typography.sizes["2xl"],
              fontWeight: tokens.typography.weights.bold,
              letterSpacing: 1,
              minWidth: 40,
              textAlign: "center",
            }}
          >
            {value}
          </Text>
          {unit ? (
            <Text
              style={{
                color: colors.primary,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
              }}
            >
              {unit}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          onPress={handleIncrementPress}
          onPressIn={handleIncrementPressIn}
          onPressOut={handleIncrementPressOut}
          disabled={value >= max}
          hitSlop={hitSlop}
          accessibilityLabel="Increase value"
          accessibilityRole="button"
          className="items-center justify-center rounded-xl border p-3"
          style={{
            borderColor: colors.primary,
            backgroundColor: colors.card,
            opacity: value >= max ? 0.5 : 1,
          }}
        >
          <Plus size={24} color={colors.primary} />
        </Pressable>
      </View>
      <WheelPickerModal
        visible={pickerVisible}
        value={value}
        min={min}
        max={max}
        step={step}
        unit={unit}
        title={pickerTitle}
        onSelect={handlePickerSelect}
        onDismiss={handlePickerDismiss}
      />
    </>
  );
}
