import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme-context";
import {
  addExerciseToSessionTemplate,
  deleteSessionTemplateExercise,
  getExercisesForSessionTemplate,
  setSupersetForExercises,
  updateSessionTemplateExercise,
} from "@/features/planner/planner-repository";
import { FormField } from "@/components/forms";
import { Plus, Trash2, Pencil, GripVertical, Check } from "lucide-react-native";
import { LoadingState } from "@/components/feedback-states";
import type { PlanExercise } from "@/types/workout-session";
import { getHitSlop, resolveAccessibilityLabel } from "@/lib/accessibility";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal, useModal } from "@/components/ui/modal";
import uuid from "react-native-uuid";
import { useWeightUnit } from "@/hooks/use-weight-unit";

function ExerciseListItem({
  exercise,
  isEditing,
  isActive,
  isBusy,
  onDrag,
  onEdit,
  onDelete,
}: {
  exercise: PlanExercise;
  isEditing: boolean;
  isActive: boolean;
  isBusy: boolean;
  onDrag: () => void;
  onEdit: () => void;
  onDelete: () => void;
}): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { formatWeight } = useWeightUnit();
  return (
    <View
      className="mb-2 flex-row items-center justify-between rounded-lg border p-3"
      style={{
        borderColor: isActive ? `${colors.foreground}40` : colors.muted,
        backgroundColor: colors.card,
      }}
    >
      <View
        className="flex-row items-center"
        style={{ gap: tokens.spacing.sm }}
      >
        <Pressable
          onPressIn={onDrag}
          disabled={isBusy}
          hitSlop={getHitSlop()}
          accessibilityRole="button"
          accessibilityLabel={resolveAccessibilityLabel({
            fallback: `Reorder ${exercise.name}`,
          })}
        >
          <GripVertical
            size={20}
            color={isBusy ? colors.mutedForeground : colors.foreground}
          />
        </Pressable>
        <View className="min-w-0 flex-1">
          <P style={{ fontWeight: tokens.typography.weights.semibold }}>
            {exercise.name}
          </P>
          <P
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.sm,
            }}
          >
            {exercise.sets} × {exercise.reps} reps ·{" "}
            {formatWeight(exercise.weight)}
          </P>
          {exercise.supersetGroupId ? (
            <View
              className="mt-1 self-start rounded-full px-2 py-0.5"
              style={{ backgroundColor: colors.muted }}
            >
              <P
                style={{
                  color: colors.mutedForeground,
                  fontSize: tokens.typography.sizes.xs,
                }}
              >
                Superset
              </P>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={onEdit}
          disabled={isEditing || isBusy}
          hitSlop={getHitSlop()}
          accessibilityRole="button"
          accessibilityLabel={resolveAccessibilityLabel({
            fallback: `Edit ${exercise.name}`,
          })}
        >
          <Pencil
            size={20}
            color={isEditing ? colors.mutedForeground : colors.foreground}
          />
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={isBusy}
          hitSlop={getHitSlop()}
          accessibilityRole="button"
          accessibilityLabel={resolveAccessibilityLabel({
            fallback: `Delete ${exercise.name}`,
          })}
        >
          <Trash2 size={20} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const DEFAULT_WEIGHT_KG = 20;

export default function SessionExercisesScreen(): React.ReactElement {
  const router = useRouter();
  const { sessionTemplateId, sessionName } = useLocalSearchParams<{
    sessionTemplateId: string;
    sessionName?: string;
  }>();
  const { colors, tokens } = useTheme();
  const { formatWeight, fromKg, toKg, weightUnitLabel } = useWeightUnit();
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const defaultWeightDisplay = fromKg(DEFAULT_WEIGHT_KG);
  const [weight, setWeight] = useState(() =>
    defaultWeightDisplay % 1 === 0
      ? String(defaultWeightDisplay)
      : defaultWeightDisplay.toFixed(1)
  );
  const [submitting, setSubmitting] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null
  );
  const [supersetSelection, setSupersetSelection] = useState<
    Record<string, boolean>
  >({});
  const supersetModal = useModal();

  const load = useCallback(
    async (showSpinner = true): Promise<void> => {
      if (!sessionTemplateId) return;
      if (showSpinner) setLoading(true);
      try {
        const list = await getExercisesForSessionTemplate(sessionTemplateId);
        setExercises(list);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [sessionTemplateId]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const resetForm = useCallback((): void => {
    setName("");
    setSets("3");
    setReps("10");
    setWeight(
      defaultWeightDisplay % 1 === 0
        ? String(defaultWeightDisplay)
        : defaultWeightDisplay.toFixed(1)
    );
    setEditingExerciseId(null);
  }, [defaultWeightDisplay]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!sessionTemplateId || !name.trim()) return;
    setSubmitting(true);
    try {
      const weightKg = toKg(parseFloat(weight) || defaultWeightDisplay);
      const payload = {
        name: name.trim(),
        sets: Math.max(1, parseInt(sets, 10) || 3),
        reps: Math.max(1, parseInt(reps, 10) || 10),
        weight: Math.max(0, weightKg),
      };
      if (editingExerciseId) {
        await updateSessionTemplateExercise(editingExerciseId, payload);
      } else {
        await addExerciseToSessionTemplate(sessionTemplateId, payload);
      }
      await load(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }, [
    sessionTemplateId,
    name,
    sets,
    reps,
    weight,
    defaultWeightDisplay,
    toKg,
    editingExerciseId,
    load,
    resetForm,
  ]);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      await deleteSessionTemplateExercise(id);
      if (editingExerciseId === id) resetForm();
      await load(false);
    },
    [editingExerciseId, load, resetForm]
  );

  const handleEdit = useCallback(
    (exercise: PlanExercise): void => {
      setEditingExerciseId(exercise.id);
      setName(exercise.name);
      setSets(String(exercise.sets));
      setReps(String(exercise.reps));
      const displayWeight = fromKg(exercise.weight);
      setWeight(
        displayWeight % 1 === 0
          ? String(displayWeight)
          : displayWeight.toFixed(1)
      );
    },
    [fromKg]
  );

  const handleCancelEdit = useCallback((): void => {
    resetForm();
  }, [resetForm]);

  const selectedExerciseIds = useMemo(
    () => Object.keys(supersetSelection).filter((id) => supersetSelection[id]),
    [supersetSelection]
  );
  const selectedExercises = useMemo(
    () =>
      exercises.filter((exercise) => selectedExerciseIds.includes(exercise.id)),
    [exercises, selectedExerciseIds]
  );
  const selectedSupersetIds = useMemo(() => {
    const ids = selectedExercises
      .map((exercise) => exercise.supersetGroupId ?? null)
      .filter((id): id is string => Boolean(id));
    return new Set(ids);
  }, [selectedExercises]);
  const selectedSupersetId =
    selectedSupersetIds.size === 1 ? Array.from(selectedSupersetIds)[0] : null;
  const canCreateSuperset = selectedExerciseIds.length >= 2;
  const canRemoveSuperset =
    selectedExerciseIds.length >= 1 && selectedSupersetId != null;

  const toggleSupersetSelection = useCallback((id: string): void => {
    setSupersetSelection((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearSupersetSelection = useCallback((): void => {
    setSupersetSelection({});
  }, []);

  const handleCreateSuperset = useCallback(async (): Promise<void> => {
    if (!canCreateSuperset) return;
    const groupId = String(uuid.v4());
    setSubmitting(true);
    try {
      await setSupersetForExercises(selectedExerciseIds, groupId);
      await load(false);
      clearSupersetSelection();
    } finally {
      setSubmitting(false);
    }
    supersetModal.dismiss();
  }, [
    canCreateSuperset,
    clearSupersetSelection,
    load,
    selectedExerciseIds,
    supersetModal,
  ]);

  const handleRemoveSuperset = useCallback(async (): Promise<void> => {
    if (!canRemoveSuperset) return;
    setSubmitting(true);
    try {
      await setSupersetForExercises(selectedExerciseIds, null);
      await load(false);
      clearSupersetSelection();
    } finally {
      setSubmitting(false);
    }
    supersetModal.dismiss();
  }, [
    canRemoveSuperset,
    clearSupersetSelection,
    load,
    selectedExerciseIds,
    supersetModal,
  ]);

  const persistOrder = useCallback(
    async (next: PlanExercise[]): Promise<void> => {
      if (!sessionTemplateId) return;
      setSubmitting(true);
      try {
        for (let i = 0; i < next.length; i += 1) {
          await updateSessionTemplateExercise(next[i].id, { position: i });
        }
      } finally {
        setSubmitting(false);
      }
    },
    [sessionTemplateId]
  );

  const handleDragEnd = useCallback(
    async (next: PlanExercise[]): Promise<void> => {
      setExercises(next);
      await persistOrder(next);
      await load(false);
    },
    [load, persistOrder]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PlanExercise>) => (
      <ExerciseListItem
        exercise={item}
        isEditing={editingExerciseId === item.id}
        isActive={isActive}
        isBusy={submitting}
        onDrag={drag}
        onEdit={() => handleEdit(item)}
        onDelete={() => void handleDelete(item.id)}
      />
    ),
    [editingExerciseId, handleEdit, handleDelete, submitting]
  );

  const title = sessionName ?? "Session exercises";
  const header = useMemo(
    () => (
      <View
        className="mb-3 rounded-lg border p-3"
        style={{ borderColor: colors.border, backgroundColor: colors.card }}
      >
        <View className="flex-row items-center justify-between">
          <P style={{ fontWeight: tokens.typography.weights.semibold }}>
            Supersets
          </P>
          <Button
            label="Manage"
            variant="ghost"
            size="sm"
            onPress={() => {
              clearSupersetSelection();
              supersetModal.present();
            }}
            disabled={submitting || exercises.length < 2}
          />
        </View>
        <P
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          Group exercises to perform back-to-back.
        </P>
      </View>
    ),
    [
      clearSupersetSelection,
      colors.border,
      colors.card,
      colors.mutedForeground,
      exercises.length,
      submitting,
      supersetModal,
      tokens.typography.sizes.sm,
      tokens.typography.weights.semibold,
    ]
  );
  const footer = useMemo(
    () => (
      <View
        className="mt-4 border-t pb-12 pt-4"
        style={{ borderColor: colors.border }}
      >
        <P
          className="mb-2"
          style={{ fontWeight: tokens.typography.weights.semibold }}
        >
          {editingExerciseId ? "Edit exercise" : "Add exercise"}
        </P>
        <FormField label="Name">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bench Press"
            editable={!submitting}
          />
        </FormField>
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <FormField label="Sets">
              <Input
                value={sets}
                onChangeText={setSets}
                placeholder="3"
                keyboardType="number-pad"
                editable={!submitting}
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="Reps">
              <Input
                value={reps}
                onChangeText={setReps}
                placeholder="10"
                keyboardType="number-pad"
                editable={!submitting}
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={`Weight (${weightUnitLabel})`}>
              <Input
                value={weight}
                onChangeText={setWeight}
                placeholder={
                  defaultWeightDisplay % 1 === 0
                    ? String(defaultWeightDisplay)
                    : defaultWeightDisplay.toFixed(1)
                }
                keyboardType="decimal-pad"
                editable={!submitting}
              />
            </FormField>
          </View>
        </View>
        <Button
          label={editingExerciseId ? "Update exercise" : "Add exercise"}
          variant="outline"
          size="sm"
          icon={
            !editingExerciseId ? (
              <Plus size={16} color={colors.foreground} className="mr-2" />
            ) : (
              <Check size={16} color={colors.foreground} className="mr-2" />
            )
          }
          iconPlacement="left"
          onPress={() => void handleSubmit()}
          disabled={submitting || !name.trim()}
          className="mt-2"
        />
        {editingExerciseId ? (
          <Button
            label="Cancel edit"
            variant="ghost"
            size="sm"
            onPress={handleCancelEdit}
            className="mt-2"
            disabled={submitting}
          />
        ) : null}
      </View>
    ),
    [
      colors.border,
      colors.foreground,
      editingExerciseId,
      handleCancelEdit,
      handleSubmit,
      name,
      reps,
      sets,
      submitting,
      tokens.typography.weights.semibold,
      weight,
    ]
  );

  if (!sessionTemplateId) {
    return (
      <Screen safeAreaEdges={["top", "bottom"]}>
        <Stack.Screen options={headerOptions({ title: "Exercises" })} />
        <AppHeader title="Exercises" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <P style={{ color: colors.mutedForeground }}>Missing session.</P>
          <Button
            label="Back"
            variant="outline"
            className="mt-4"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title })} />
        <AppHeader title={title} showBackButton />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading..." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      contentContainerClassName="pb-12"
      safeAreaEdges={["top", "bottom"]}
    >
      <Stack.Screen options={headerOptions({ title })} />
      <AppHeader title={title} showBackButton />
      <DraggableFlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => void handleDragEnd(data)}
        activationDistance={8}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.md,
          paddingBottom: tokens.spacing.lg,
        }}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        style={{
          marginBottom: 48,
        }}
      />
      <Modal ref={supersetModal.ref} title="Supersets" snapPoints={["60%"]}>
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          activationDistance={8}
          renderItem={({ item }) => {
            const isSelected = Boolean(supersetSelection[item.id]);
            return (
              <Checkbox.Root
                checked={isSelected}
                onChange={() => toggleSupersetSelection(item.id)}
                accessibilityLabel={
                  resolveAccessibilityLabel({
                    fallback: `Select ${item.name}`,
                  }) ?? `Select ${item.name}`
                }
                disabled={submitting}
                className="rounded-lg border p-3"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Checkbox.Icon checked={isSelected} />
                <View className="min-w-0 flex-1">
                  <P style={{ fontWeight: tokens.typography.weights.semibold }}>
                    {item.name}
                  </P>
                  <P
                    style={{
                      color: colors.mutedForeground,
                      fontSize: tokens.typography.sizes.sm,
                    }}
                  >
                    {item.sets} × {item.reps} reps · {formatWeight(item.weight)}
                  </P>
                  {item.supersetGroupId ? (
                    <P
                      style={{
                        color: colors.mutedForeground,
                        fontSize: tokens.typography.sizes.xs,
                      }}
                    >
                      In superset
                    </P>
                  ) : null}
                </View>
              </Checkbox.Root>
            );
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: tokens.spacing.md,
            paddingBottom: tokens.spacing.xl,
            gap: tokens.spacing.sm,
          }}
          ListHeaderComponent={
            <View className="px-4 pb-2">
              <P style={{ color: colors.mutedForeground }}>
                Select exercises to group together.
              </P>
            </View>
          }
          ListFooterComponent={
            <View className="px-4 pb-6" style={{ gap: tokens.spacing.sm }}>
              <Button
                label="Create superset"
                variant="outline"
                size="sm"
                onPress={() => void handleCreateSuperset()}
                disabled={submitting || !canCreateSuperset}
              />
              <Button
                label="Remove superset"
                variant="ghost"
                size="sm"
                onPress={() => void handleRemoveSuperset()}
                disabled={submitting || !canRemoveSuperset}
              />
            </View>
          }
        />
      </Modal>
    </Screen>
  );
}
