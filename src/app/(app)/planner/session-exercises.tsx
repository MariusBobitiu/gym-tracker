import React, { useCallback, useEffect, useState } from "react";
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
} from "@/features/planner/planner-repository";
import { FormField } from "@/components/forms";
import { Plus, Trash2 } from "lucide-react-native";
import { ScrollView } from "moti";
import { LoadingState } from "@/components/feedback-states";
import type { PlanExercise } from "@/types/workout-session";

function ExerciseListItem({
  exercise,
  onDelete,
}: {
  exercise: PlanExercise;
  onDelete: () => void;
}): React.ReactElement {
  const { colors, tokens } = useTheme();
  return (
    <View
      className="mb-2 flex-row items-center justify-between rounded-lg border p-3"
      style={{ borderColor: colors.border, backgroundColor: colors.card }}
    >
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
          {exercise.sets} × {exercise.reps} reps · {exercise.weight} kg
        </P>
      </View>
      <Pressable onPress={onDelete}>
        <Trash2 size={20} color={colors.destructive} />
      </Pressable>
    </View>
  );
}

export default function SessionExercisesScreen(): React.ReactElement {
  const router = useRouter();
  const { sessionTemplateId, sessionName } = useLocalSearchParams<{
    sessionTemplateId: string;
    sessionName?: string;
  }>();
  const { colors, tokens } = useTheme();
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("20");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!sessionTemplateId) return;
    setLoading(true);
    const list = await getExercisesForSessionTemplate(sessionTemplateId);
    setExercises(list);
    setLoading(false);
  }, [sessionTemplateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    if (!sessionTemplateId || !name.trim()) return;
    setSubmitting(true);
    try {
      await addExerciseToSessionTemplate(sessionTemplateId, {
        name: name.trim(),
        sets: Math.max(1, parseInt(sets, 10) || 3),
        reps: Math.max(1, parseInt(reps, 10) || 10),
        weight: Math.max(0, parseFloat(weight) || 20),
      });
      await load();
      setName("");
      setSets("3");
      setReps("10");
      setWeight("20");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteSessionTemplateExercise(id);
    await load();
  };

  const title = sessionName ?? "Session exercises";

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
      safeAreaEdges={["bottom", "top"]}
    >
      <Stack.Screen options={headerOptions({ title })} />
      <AppHeader title={title} showBackButton />
      <ScrollView
        className="flex-1 px-4 py-4"
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((ex) => (
          <ExerciseListItem
            key={ex.id}
            exercise={ex}
            onDelete={() => void handleDelete(ex.id)}
          />
        ))}
        <View
          className="mt-4 border-t pt-4"
          style={{ borderColor: colors.border }}
        >
          <P
            className="mb-2"
            style={{ fontWeight: tokens.typography.weights.semibold }}
          >
            Add exercise
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
              <FormField label="Weight (kg)">
                <Input
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="20"
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </FormField>
            </View>
          </View>
          <Button
            label="Add exercise"
            variant="outline"
            size="sm"
            icon={<Plus size={16} color={colors.foreground} />}
            iconPlacement="left"
            onPress={() => void handleAdd()}
            disabled={submitting || !name.trim()}
            className="mt-2"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
