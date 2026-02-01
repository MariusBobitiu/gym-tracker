import React, { useCallback, useEffect, useRef, useState } from "react";
import { Screen } from "@/components/screen";
import { BackgroundGradient } from "@/components/background-gradient";
import { Button, P, View } from "@/components/ui";
import { ProgressRing } from "@/components/progress-ring";
import { formatElapsedMs } from "@/lib/format-elapsed";
import { useTheme } from "@/lib/theme-context";
import { Check } from "lucide-react-native";

const REST_DURATION_SECONDS = 90;
const RING_SIZE = 220;
const RING_STROKE = 12;

function formatRemainingSeconds(seconds: number): string {
  return formatElapsedMs(seconds * 1000);
}

type WorkoutRestContentProps = {
  completedLabel: string;
  onSkipRest: () => void;
};

export function WorkoutRestContent({
  completedLabel,
  onSkipRest,
}: WorkoutRestContentProps): React.ReactElement {
  const { colors } = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(
    REST_DURATION_SECONDS
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onSkipRest();
  }, [onSkipRest]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(onSkipRest, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onSkipRest]);

  const progressValue =
    remainingSeconds <= 0 ? 1 : 1 - remainingSeconds / REST_DURATION_SECONDS;

  return (
    <>
      <View className="flex-1 items-center justify-center">
        <ProgressRing
          value={progressValue}
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
          trackOpacity={0.6}
          showCenterText
          label="Rest"
          subLabel={formatRemainingSeconds(remainingSeconds)}
        />
        <P
          className="mt-6 text-center"
          style={{ color: colors.mutedForeground }}
        >
          {completedLabel}
        </P>
      </View>
      <View className="w-full pb-4">
        <Button
          label="Skip rest"
          variant="outline"
          size="lg"
          onPress={handleSkip}
          accessibilityLabel="Skip rest"
        />
      </View>
    </>
  );
}
