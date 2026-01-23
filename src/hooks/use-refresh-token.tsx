import { useCallback, useState } from "react";

type RefreshTokenResult = {
  access: string;
  refresh?: string;
} | null;

export function useRefreshToken() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (): Promise<RefreshTokenResult> => {
    setIsRefreshing(true);
    try {
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { refresh, isRefreshing };
}
