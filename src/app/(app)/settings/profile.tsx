import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/forms";
import { Button, Card, Input, P, Text, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useSession } from "@/lib/auth/context";
import { triggerHaptic } from "@/lib/haptics";
import {
  getAllSplits,
  deleteSplit,
  getActivePlan,
  type SplitRow,
} from "@/features/planner/planner-repository";
import { resetRotationPointer } from "@/features/planner/rotation-state";
import { LoadingState } from "@/components/feedback-states";

export default function ProfileSettingsScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const { user } = useSession();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayName = typeof user?.name === "string" ? user.name : "";
  const displayUsername =
    typeof user?.username === "string" ? user.username : "";

  useEffect(() => {
    setName(displayName);
    setUsername(displayUsername);
  }, [displayName, displayUsername]);

  const loadSplits = useCallback(async (): Promise<void> => {
    setLoading(true);
    const list = await getAllSplits();
    setSplits(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSplits();
  }, [loadSplits]);

  async function handleSaveProfile(): Promise<void> {
    setSaving(true);
    triggerHaptic("light");
    // No profile update API yet – placeholder
    setSaving(false);
    Alert.alert(
      "Profile",
      "Profile update is not available yet. It will sync with your account when the feature is ready."
    );
  }

  function handleEditSplit(splitId: string): void {
    router.push(
      `/planner/split-builder?splitId=${encodeURIComponent(splitId)}` as never
    );
  }

  async function handleRemoveSplit(split: SplitRow): Promise<void> {
    const activePlan = await getActivePlan();
    const isActive = activePlan?.split.id === split.id;

    Alert.alert(
      "Remove split",
      `Remove "${split.name}"? This cannot be undone.${isActive ? " This is your active plan – you will need to set up a new one." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("warning");
            setDeletingId(split.id);
            try {
              await deleteSplit(split.id);
              if (isActive) {
                try {
                  resetRotationPointer();
                } catch (e) {
                  console.warn("resetRotationPointer:", e);
                }
              }
              await loadSplits();
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Failed to remove split.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen options={headerOptions({ title: "Profile" })} />
      <AppHeader showBackButton title="Profile" />

      <UIView className="gap-6 px-2 pt-4">
        <UIView className="gap-4">
          <P
            className="uppercase tracking-[2px]"
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.xs,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            Profile
          </P>
          <FormField label="Name">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
            />
          </FormField>
          <FormField label="Username">
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>
          <Button
            label="Save"
            onPress={handleSaveProfile}
            disabled={saving}
            variant="outline"
          />
        </UIView>

        <UIView className="gap-3">
          <Text
            className="uppercase tracking-[2px]"
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.xs,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            My splits
          </Text>
          {loading ? (
            <LoadingState label="Loading splits..." />
          ) : splits.length === 0 ? (
            <Card>
              <P style={{ color: colors.mutedForeground }}>
                No custom splits yet. Create one from the Planner.
              </P>
              <Button
                label="Go to Planner"
                variant="outline"
                size="sm"
                className="mt-2"
                onPress={() => router.push({ pathname: "/planner" } as never)}
              />
            </Card>
          ) : (
            <UIView className="gap-2">
              {splits.map((split) => (
                <Card
                  key={split.id}
                  className="flex-row items-center justify-between py-3"
                >
                  <P
                    style={{
                      color: colors.foreground,
                      fontWeight: tokens.typography.weights.medium,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {split.name}
                  </P>
                  <UIView className="flex-row gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil size={18} color={colors.foreground} />}
                      onPress={() => handleEditSplit(split.id)}
                      accessibilityLabel={`Edit ${split.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={18} color={colors.destructive} />}
                      onPress={() => handleRemoveSplit(split)}
                      disabled={deletingId === split.id}
                      accessibilityLabel={`Remove ${split.name}`}
                    />
                  </UIView>
                </Card>
              ))}
            </UIView>
          )}
        </UIView>

        <UIView className="gap-3 pt-4">
          <Text
            className="uppercase tracking-[2px]"
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.xs,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            DANGER ZONE
          </Text>
          <Button
            variant="destructive"
            label="Delete account"
            onPress={() => {
              Alert.alert(
                "Delete account",
                "Are you sure? This cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      triggerHaptic("warning");
                      Alert.alert(
                        "Delete account",
                        "Contact support to delete your account. This feature is not available yet."
                      );
                    },
                  },
                ]
              );
            }}
            accessibilityLabel="Delete account"
          />
        </UIView>
      </UIView>
    </Screen>
  );
}
