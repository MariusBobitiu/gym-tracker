import React, { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { showMessage } from "react-native-flash-message";
import * as WebBrowser from "expo-web-browser";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P, View as UIView } from "@/components/ui";
import { resolveLegalUrl } from "@/lib/legal-links";
import { useTheme } from "@/lib/theme-context";

export default function TermsSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const [hasOpened, setHasOpened] = useState(false);
  const url = resolveLegalUrl("/terms");

  const openModal = useCallback(async (): Promise<void> => {
    if (!url) {
      showMessage({
        message: "Missing legal URL",
        description: "Set EXPO_PUBLIC_SITE_URL in .env to open legal pages.",
        type: "danger",
        duration: 3500,
      });
      return;
    }
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      showTitle: true,
      enableBarCollapsing: true,
      toolbarColor: colors.background,
      controlsColor: colors.foreground,
    });
  }, [colors.background, colors.foreground, url]);

  useEffect(() => {
    if (hasOpened) return;
    setHasOpened(true);
    openModal().catch((error) => {
      console.warn("[legal] openBrowserAsync failed", error);
      showMessage({
        message: "Unable to open Terms & Conditions",
        type: "danger",
        duration: 3000,
      });
    });
  }, [hasOpened, openModal]);

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen options={headerOptions({ title: "Terms & Conditions" })} />
      <AppHeader showBackButton title="Terms & Conditions" />
      <UIView className="gap-3 px-2 pt-4">
        <P style={{ color: colors.mutedForeground }}>
          The Terms open in a secure in-app browser.
        </P>
        <Button
          label="Open Terms & Conditions"
          variant="outline"
          onPress={() => void openModal()}
        />
        {!url && (
          <P
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.sm,
            }}
          >
            Missing EXPO_PUBLIC_SITE_URL in .env.
          </P>
        )}
      </UIView>
    </Screen>
  );
}
