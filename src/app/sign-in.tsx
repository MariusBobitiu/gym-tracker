import { View } from "react-native";

import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { BackgroundGradient } from "@/components/background-gradient";

export default function SignIn() {
  const { signIn } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <BackgroundGradient />
      <Button
        onPress={() => {
          signIn({
            user: { id: "demo-user" },
            token: { access: "demo-token", refresh: "demo-refresh" },
          });
        }}
        label="Sign In"
      />
    </View>
  );
}
