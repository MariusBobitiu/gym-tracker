import React, { useCallback, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@/lib/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WheelPickerModalProps = {
  visible: boolean;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  title?: string;
  onSelect: (value: number) => void;
  onDismiss: () => void;
};

function getOptions(min: number, max: number, step: number): number[] {
  const opts: number[] = [];
  for (let i = min; i <= max; i += step) {
    opts.push(i);
  }
  return opts;
}

export function WheelPickerModal({
  visible,
  value,
  min,
  max,
  step = 1,
  unit,
  title,
  onSelect,
  onDismiss,
}: WheelPickerModalProps): React.ReactElement {
  const { colors, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [pickerValue, setPickerValue] = useState(value);

  const options = useMemo(() => getOptions(min, max, step), [min, max, step]);

  const handleDone = useCallback(() => {
    onSelect(pickerValue);
    onDismiss();
  }, [onSelect, onDismiss, pickerValue]);

  React.useEffect(() => {
    if (visible) setPickerValue(value);
  }, [visible, value]);

  if (!visible) return <></>;

  const isIOS = Platform.OS === "ios";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={() => {}}>
          <View
            style={[
              styles.toolbar,
              {
                borderBottomColor: colors.border,
                paddingTop: insets.top + 8,
              },
            ]}>
            <Pressable onPress={onDismiss} hitSlop={12} style={styles.toolbarSide}>
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text>
            </Pressable>
            {title ? (
              <Text
                style={[
                  styles.toolbarTitle,
                  { color: colors.foreground, fontSize: tokens.typography.sizes.lg },
                ]}>
                {title}
              </Text>
            ) : null}
            <Pressable onPress={handleDone} hitSlop={12} style={styles.toolbarSide}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}>
                Done
              </Text>
            </Pressable>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={pickerValue}
              onValueChange={(v) => setPickerValue(v as number)}
              style={[styles.picker, { color: colors.foreground }]}
              itemStyle={
                isIOS
                  ? {
                      fontSize: tokens.typography.sizes["2xl"],
                      color: colors.foreground,
                    }
                  : undefined
              }
              mode="dialog">
              {options.map((opt) => (
                <Picker.Item key={opt} label={unit ? `${opt} ${unit}` : String(opt)} value={opt} />
              ))}
            </Picker>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 280,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarSide: {
    minWidth: 70,
  },
  toolbarTitle: {
    fontWeight: "600",
  },
  pickerContainer: {
    height: 180,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    ...(Platform.OS === "android" && { height: 180 }),
  },
});
