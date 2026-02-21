import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import { showMessage } from "react-native-flash-message";
import uuid from "react-native-uuid";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/forms";
import { Button, P, Input, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useSession } from "@/lib/auth/context";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type BugReport,
} from "@/lib/storage";
import { triggerHaptic } from "@/lib/haptics";
import { getAppLogs } from "@/lib/app-logger";
import { requestContact } from "@/lib/contact-api";
import { showQueryError } from "@/lib/query/query-error";

const SUPPORT_EMAIL = "support@vixe.app";
const BUG_SUBJECT = "Vixe App - Bug report";

function buildBugReportMessage(
  description: string,
  stepsToReproduce: string,
  logs: BugReport["logs"]
): string {
  const sections = [`Description:\n${description}`];
  if (stepsToReproduce) {
    sections.push(`Steps to reproduce:\n${stepsToReproduce}`);
  }
  const logsText =
    logs && logs.length > 0
      ? JSON.stringify(logs, null, 2)
      : "No logs recorded.";
  sections.push(`--- Logs ---\n${logsText}`);
  return sections.join("\n\n");
}

export default function ReportBugSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { user } = useSession();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(BUG_SUBJECT)}`;

  const resetForm = useCallback((): void => {
    setSubject("");
    setDescription("");
    setStepsToReproduce("");
  }, []);

  async function handleSubmit(): Promise<void> {
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    const trimmedSteps = stepsToReproduce.trim();
    if (!trimmedSubject || !trimmedDescription) {
      Alert.alert("Missing fields", "Please enter a subject and description.");
      return;
    }
    setSubmitting(true);
    triggerHaptic("light");
    try {
      const reports = getStorageItem(STORAGE_KEYS.bugReports) ?? [];
      const logs = getAppLogs();
      const message = buildBugReportMessage(
        trimmedDescription,
        trimmedSteps,
        logs.length ? logs : undefined
      );
      const report: BugReport = {
        id: uuid.v4() as string,
        subject: trimmedSubject,
        description: trimmedDescription,
        stepsToReproduce: trimmedSteps || undefined,
        logs: logs.length ? logs : undefined,
        createdAt: Date.now(),
      };
      setStorageItem(STORAGE_KEYS.bugReports, [...reports, report]);
      const result = await requestContact({
        name: user?.name ?? undefined,
        email: user?.email ?? undefined,
        subject: trimmedSubject,
        message,
      });
      if (result.ok) {
        resetForm();
        showMessage({
          message: "Report sent",
          description: "Thanks for the report. We'll look into it.",
          type: "success",
          duration: 4000,
          icon: "success",
        });
      } else {
        showQueryError(result.error);
      }
    } catch (e) {
      console.error(e);
      showQueryError(e);
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenMail(): void {
    Linking.openURL(mailto);
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen options={headerOptions({ title: "Report a bug" })} />
      <AppHeader showBackButton title="Report a bug" />

      <UIView className="gap-4 px-2 pt-4">
        <P
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
          }}
        >
          Describe the issue and what you were doing when it happened. Reports
          are sent to our team and saved on this device.
        </P>

        <FormField label="Subject" required helper="Short title for the bug">
          <Input
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. App crashes when starting a workout"
            autoCapitalize="sentences"
          />
        </FormField>

        <FormField
          label="Description"
          required
          helper="What happened? What did you expect?"
        >
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the bug in detail..."
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
        </FormField>

        <FormField
          label="Steps to reproduce (optional)"
          helper="How can we reproduce this?"
        >
          <Input
            value={stepsToReproduce}
            onChangeText={setStepsToReproduce}
            placeholder="e.g. 1. Open Planner 2. Tap session 3. App freezes"
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: "top" }}
          />
        </FormField>

        <Button
          label="Save report"
          onPress={handleSubmit}
          disabled={submitting}
          variant="primary"
        />

        <UIView
          className="flex-row items-center gap-3 py-2"
          style={{ marginTop: tokens.spacing.xs }}
        >
          <UIView
            className="flex-1"
            style={{ height: 1, backgroundColor: colors.border }}
          />
          <P
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.sm,
              lineHeight: tokens.typography.lineHeights.sm,
            }}
          >
            Or
          </P>
          <UIView
            className="flex-1"
            style={{ height: 1, backgroundColor: colors.border }}
          />
        </UIView>

        <P
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
            lineHeight: tokens.typography.lineHeights.sm,
          }}
        >
          Send the report via email instead.
        </P>
        <Button
          label="Open email to report bug"
          variant="outline"
          onPress={handleOpenMail}
        />
      </UIView>
    </Screen>
  );
}
