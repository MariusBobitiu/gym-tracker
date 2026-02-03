import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Returns whether the device has internet connectivity.
 * Used to show offline banner and trigger background refresh when back online.
 */
export function useConnectivity(): boolean {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
    });

    void NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return isConnected === true;
}
