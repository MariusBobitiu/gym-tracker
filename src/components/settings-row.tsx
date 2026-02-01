import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";
import { Link } from "expo-router";
import { P, Text, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  children,
}: SettingsSectionProps): React.ReactElement {
  const { colors, tokens } = useTheme();

  const cardStyle = React.useMemo(
    () => ({
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      overflow: "hidden" as const,
    }),
    [colors.card, colors.border, tokens.radius.md]
  );

  return (
    <UIView className="gap-2">
      <Text
        className="uppercase tracking-[2px]"
        style={{
          color: colors.mutedForeground,
          fontSize: tokens.typography.sizes.xs,
          fontWeight: tokens.typography.weights.medium,
        }}
      >
        {title}
      </Text>
      <UIView style={cardStyle}>{children}</UIView>
    </UIView>
  );
}

type SettingsRowBaseProps = {
  label: string;
  value?: string;
  valueStyle?: "default" | "muted" | "primary";
  showDivider?: boolean;
};

type SettingsRowLinkProps = SettingsRowBaseProps & {
  href: string;
  onPress?: never;
};

type SettingsRowPressProps = SettingsRowBaseProps & {
  href?: never;
  onPress: () => void;
};

export type SettingsRowProps = SettingsRowLinkProps | SettingsRowPressProps;

export function SettingsRow({
  label,
  value,
  valueStyle = "muted",
  showDivider = true,
  ...rest
}: SettingsRowProps): React.ReactElement {
  const { colors, tokens } = useTheme();

  const valueColor =
    valueStyle === "primary"
      ? colors.primary
      : valueStyle === "muted"
        ? colors.mutedForeground
        : colors.foreground;

  const content = (
    <UIView
      className="flex-row items-center justify-between px-4 py-3"
      style={
        showDivider
          ? { borderBottomWidth: 1, borderBottomColor: colors.border }
          : undefined
      }
    >
      <P style={{ color: colors.foreground, flex: 1 }}>{label}</P>
      {value != null && (
        <P
          className="mr-2"
          style={{
            color: valueColor,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          {value}
        </P>
      )}
      <ChevronRight size={20} color={colors.mutedForeground} />
    </UIView>
  );

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href as never} asChild>
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          {content}
        </Pressable>
      </Link>
    );
  }

  const onPress = "onPress" in rest ? rest.onPress : undefined;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}
