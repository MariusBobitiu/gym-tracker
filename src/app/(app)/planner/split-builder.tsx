import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme-context";
import { createCustomSplit, type CustomVariantInput } from "@/features/planner/planner-repository";
import { FormField } from "@/components/forms";
import { Plus, Trash2 } from "lucide-react-native";
import { ScrollView } from "moti";

export default function SplitBuilderScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [splitName, setSplitName] = useState("My split");
  const [variantA, setVariantA] = useState<string[]>(["Session 1", "Session 2"]);
  const [variantB, setVariantB] = useState<string[] | null>(null);
  const [variantC, setVariantC] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSession = (variant: "A" | "B" | "C"): void => {
    if (variant === "A") setVariantA((prev) => [...prev, `Session ${prev.length + 1}`]);
    if (variant === "B")
      setVariantB((prev) => [...(prev ?? []), `Session ${(prev?.length ?? 0) + 1}`]);
    if (variant === "C")
      setVariantC((prev) => [...(prev ?? []), `Session ${(prev?.length ?? 0) + 1}`]);
  };

  const removeSession = (variant: "A" | "B" | "C", index: number): void => {
    if (variant === "A") setVariantA((prev) => prev.filter((_, i) => i !== index));
    if (variant === "B" && variantB)
      setVariantB((prev) => (prev ?? []).filter((_, i) => i !== index));
    if (variant === "C" && variantC)
      setVariantC((prev) => (prev ?? []).filter((_, i) => i !== index));
  };

  const updateSessionName = (variant: "A" | "B" | "C", index: number, name: string): void => {
    if (variant === "A") setVariantA((prev) => prev.map((s, i) => (i === index ? name : s)));
    if (variant === "B" && variantB)
      setVariantB((prev) => (prev ?? []).map((s, i) => (i === index ? name : s)));
    if (variant === "C" && variantC)
      setVariantC((prev) => (prev ?? []).map((s, i) => (i === index ? name : s)));
  };

  const handleSave = async (): Promise<void> => {
    if (!splitName.trim()) return;
    const variants: CustomVariantInput[] = [{ key: "A", sessionNames: variantA }];
    if (variantB && variantB.length > 0) variants.push({ key: "B", sessionNames: variantB });
    if (variantC && variantC.length > 0) variants.push({ key: "C", sessionNames: variantC });
    setIsSubmitting(true);
    try {
      await createCustomSplit(splitName.trim(), variants);
      router.replace({ pathname: "/planner/rotation" } as never);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <Screen keyboardAvoiding safeAreaEdges={["bottom", "top"]}>
      <Stack.Screen options={headerOptions({ title: "Custom split" })} />
      <AppHeader title="Custom split" showBackButton />
      <ScrollView className="mb-12 flex-1 px-4 py-4">
        <FormField label="Split name">
          <Input
            value={splitName}
            onChangeText={setSplitName}
            placeholder="e.g. My program"
            editable={!isSubmitting}
          />
        </FormField>

        <P className="mb-2 mt-4" style={{ fontWeight: tokens.typography.weights.semibold }}>
          Variant A (required)
        </P>
        {variantA.map((name, index) => (
          <View key={`a-${index}`} className="mb-2 w-full flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <Input
                value={name}
                onChangeText={(text) => updateSessionName("A", index, text)}
                placeholder="Session name"
                editable={!isSubmitting}
              />
            </View>
            <Pressable onPress={() => removeSession("A", index)} disabled={variantA.length <= 1}>
              <Trash2 size={20} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
        <Button
          label="Add session"
          variant="outline"
          size="sm"
          icon={<Plus size={16} color={colors.foreground} />}
          iconPlacement="left"
          onPress={() => addSession("A")}
          disabled={isSubmitting}
          className="mb-4"
        />

        {variantB === null ? (
          <Button
            label="Add variant B"
            variant="ghost"
            size="sm"
            onPress={() => setVariantB(["Session 1"])}
            disabled={isSubmitting}
            className="mb-4"
          />
        ) : (
          <>
            <P className="mb-2" style={{ fontWeight: tokens.typography.weights.semibold }}>
              Variant B
            </P>
            {variantB.map((name, index) => (
              <View key={`b-${index}`} className="mb-2 w-full flex-row items-center gap-2">
                <View className="min-w-0 flex-1">
                  <Input
                    value={name}
                    onChangeText={(text) => updateSessionName("B", index, text)}
                    placeholder="Session name"
                    editable={!isSubmitting}
                  />
                </View>
                <Pressable
                  onPress={() => removeSession("B", index)}
                  disabled={variantB.length <= 1}>
                  <Trash2 size={20} color={colors.destructive} />
                </Pressable>
              </View>
            ))}
            <Button
              label="Add session"
              variant="outline"
              size="sm"
              icon={<Plus size={16} color={colors.foreground} />}
              iconPlacement="left"
              onPress={() => addSession("B")}
              disabled={isSubmitting}
              className="mb-4"
            />
          </>
        )}

        {variantC === null && variantB !== null ? (
          <Button
            label="Add variant C"
            variant="ghost"
            size="sm"
            onPress={() => setVariantC(["Session 1"])}
            disabled={isSubmitting}
            className="mb-4"
          />
        ) : variantC !== null ? (
          <>
            <P className="mb-2" style={{ fontWeight: tokens.typography.weights.semibold }}>
              Variant C
            </P>
            {variantC.map((name, index) => (
              <View key={`c-${index}`} className="mb-2 w-full flex-row items-center gap-2">
                <View className="min-w-0 flex-1">
                  <Input
                    value={name}
                    onChangeText={(text) => updateSessionName("C", index, text)}
                    placeholder="Session name"
                    editable={!isSubmitting}
                  />
                </View>
                <Pressable
                  onPress={() => removeSession("C", index)}
                  disabled={variantC.length <= 1}>
                  <Trash2 size={20} color={colors.destructive} />
                </Pressable>
              </View>
            ))}
            <Button
              label="Add session"
              variant="outline"
              size="sm"
              icon={<Plus size={16} color={colors.foreground} />}
              iconPlacement="left"
              onPress={() => addSession("C")}
              disabled={isSubmitting}
              className="mb-4"
            />
          </>
        ) : null}

        <Button
          label="Save and set rotation"
          className="mt-4 w-full"
          onPress={handleSave}
          disabled={isSubmitting}
        />
      </ScrollView>
    </Screen>
  );
}
