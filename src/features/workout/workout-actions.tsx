import React from "react";
import { Button, View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { ChevronRight } from "lucide-react-native";

type WorkoutActionsProps = {
  isCompleted: boolean;
  onDone: () => void;
  onContinue: () => void;
  onCancel: () => void;
};

export function WorkoutActions({
  isCompleted,
  onDone,
  onContinue,
  onCancel,
}: WorkoutActionsProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View>
      {isCompleted ? (
        <Button
          label="Done"
          variant="primary"
          size="lg"
          onPress={onDone}
          accessibilityLabel="Done, clear session"
        />
      ) : (
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          icon={
            <ChevronRight
              size={24}
              className="mt-[0.25px]"
              color={colors.primaryForeground}
            />
          }
          iconPlacement="right"
          onPress={onContinue}
          accessibilityLabel="Continue to next exercise"
        />
      )}
      {!isCompleted && (
        <Button
          label="Cancel workout"
          variant="link"
          onPress={onCancel}
          accessibilityLabel="Cancel workout, discard progress"
          className="mt-2"
        />
      )}
    </View>
  );
}
