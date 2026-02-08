import * as React from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { getErrorDetails, logInfo, logWarn } from "@/lib/app-logger";

export function useAppleSignInAvailable(): boolean {
  const [isAvailable, setIsAvailable] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== "ios")
      return () => {
        isMounted = false;
      };

    logInfo({ scope: "auth.apple", message: "checking availability" });
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        logInfo({
          scope: "auth.apple",
          message: "availability result",
          data: { available },
        });
        if (isMounted) setIsAvailable(available);
      })
      .catch((error) => {
        logWarn({
          scope: "auth.apple",
          message: "availability check failed",
          data: getErrorDetails(error),
        });
        if (isMounted) setIsAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return Platform.OS === "ios" && isAvailable;
}
