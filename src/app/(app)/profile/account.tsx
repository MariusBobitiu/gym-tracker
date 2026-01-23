import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { Button } from "@/components/ui";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { useTheme } from "@/lib/theme-context";

export default function Account() {
  const { colors } = useTheme();

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Account" })} />
      <AppHeader
        right={
          <Button
            variant="link"
            size="icon"
            className="p-0"
            style={{
              backgroundColor: `${colors.card.toString()}20`,
              borderRadius: 100,
              padding: 4,
              width: 44,
              height: 44,
              borderWidth: 1,
              borderColor: colors.border,
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
              elevation: 10,
            }}
            icon={<Ionicons name="pencil" size={24} color={colors.foreground} />}
          />
        }
      />
    </Screen>
  );
}
