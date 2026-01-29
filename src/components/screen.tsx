import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { BackgroundGradient } from "@/components/background-gradient";
import { useTheme } from "@/lib/theme-context";

type ScreenPreset = "fixed" | "scroll" | "modal";
type PaddingPreset = "none" | "sm" | "md" | "lg";
type ScreenBackground = "gradient" | "none";

type ScreenProps = {
  children: React.ReactNode;
  preset?: ScreenPreset;
  padding?: PaddingPreset;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
  keyboardOffset?: number;
  background?: ScreenBackground;
  className?: string;
  contentContainerClassName?: string;
  scrollProps?: ScrollViewProps;
};

const joinClassName = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");

function ModalGrabber(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View className="items-center pb-2 pt-4" style={{ backgroundColor: "transparent" }}>
      <View
        className="rounded-full"
        style={{
          width: 96,
          height: 4,
          backgroundColor: colors.mutedForeground,
          opacity: 0.5,
        }}
      />
    </View>
  );
}

export function Screen({
  children,
  preset = "fixed",
  padding = "md",
  safeAreaEdges = ["top"],
  keyboardAvoiding = false,
  keyboardOffset = 0,
  background = "gradient",
  className,
  contentContainerClassName,
  scrollProps,
}: ScreenProps) {
  const { tokens, colors } = useTheme();
  const containerClassName = joinClassName("flex-1", className);
  const scrollContainerClassName = joinClassName("flex-grow", contentContainerClassName);

  const paddingValue = React.useMemo(() => {
    switch (padding) {
      case "none":
        return 0;
      case "sm":
        return tokens.spacing.sm;
      case "md":
        return tokens.spacing.md;
      case "lg":
        return tokens.spacing.lg;
      default:
        return tokens.spacing.md;
    }
  }, [padding, tokens.spacing]);

  // Add extra bottom padding to avoid content being hidden behind bottom navigation
  const containerStyle = React.useMemo(() => ({ padding: paddingValue }), [paddingValue]);

  // Add extra bottom padding to avoid content being hidden behind bottom navigation
  const scrollContentStyle = React.useMemo(() => ({ padding: paddingValue }), [paddingValue]);

  const isModal = preset === "modal";
  const insets = useSafeAreaInsets();

  const safeAreaPadding = React.useMemo(() => {
    const edges: Edge[] = isModal ? ["bottom"] : safeAreaEdges;
    return {
      paddingTop: edges.includes("top") ? insets.top : 0,
      paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
      paddingLeft: edges.includes("left") ? insets.left : 0,
      paddingRight: edges.includes("right") ? insets.right : 0,
    };
  }, [isModal, safeAreaEdges, insets.top, insets.bottom, insets.left, insets.right]);

  const content =
    preset === "scroll" || preset === "modal" ? (
      <ScrollView
        className="flex-1"
        contentContainerClassName={scrollContainerClassName}
        contentContainerStyle={[scrollContentStyle, scrollProps?.contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}>
        {children}
      </ScrollView>
    ) : (
      <View className={containerClassName} style={containerStyle}>
        {children}
      </View>
    );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View className="flex-1" style={isModal ? { backgroundColor: colors.background } : undefined}>
      {background === "gradient" && !isModal ? <BackgroundGradient /> : null}
      <View className="flex-1 border-t border-border/10" style={safeAreaPadding}>
        {isModal && <ModalGrabber />}
        {wrappedContent}
      </View>
    </View>
  );
}
