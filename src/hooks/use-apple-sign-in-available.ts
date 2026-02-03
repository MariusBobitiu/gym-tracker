import * as React from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

export function useAppleSignInAvailable(): boolean {
  const [isAvailable, setIsAvailable] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== "ios")
      return () => {
        isMounted = false;
      };

    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (isMounted) setIsAvailable(available);
      })
      .catch(() => {
        if (isMounted) setIsAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return Platform.OS === "ios" && isAvailable;
}
