import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useConnectivity } from "@/hooks/use-connectivity";

/**
 * When connection becomes available and we're signed in offline (have refresh token
 * but no valid access token), attempt refresh in background. On success -> signedInOnline.
 * No UI blocking; does not navigate.
 */
export function useConnectivityRecovery(): void {
  const isConnected = useConnectivity();
  const wasConnectedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (isConnected === false) {
      wasConnectedRef.current = false;
      return;
    }

    const wasOffline = wasConnectedRef.current === false;
    wasConnectedRef.current = true;

    if (wasOffline) {
      const status = useAuthStore.getState().status;
      const hasRefresh = useAuthStore.getState().getRefreshToken();
      if (status === "signedInOffline" && hasRefresh) {
        void useAuthStore.getState().refreshAccessToken();
      }
    }
  }, [isConnected]);
}
