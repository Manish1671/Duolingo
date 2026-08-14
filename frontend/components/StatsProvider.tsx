"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, Me } from "@/lib/api";
import { getPrefs } from "@/lib/prefs";

type StatsContextValue = {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setHearts: (n: number) => void;
};

const StatsContext = createContext<StatsContextValue>({
  me: null,
  loading: true,
  refresh: async () => {},
  setHearts: () => {},
});

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.me(getPrefs().simulateDate || undefined);
      setMe(data);
    } catch {
      // Backend may not be up yet; keep the last known stats.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("duo-prefs", refresh);
    return () => window.removeEventListener("duo-prefs", refresh);
  }, [refresh]);

  const setHearts = useCallback((n: number) => {
    setMe((prev) => {
      if (!prev || prev.hearts === n) return prev;
      return { ...prev, hearts: n };
    });
  }, []);

  const value = useMemo(
    () => ({ me, loading, refresh, setHearts }),
    [me, loading, refresh, setHearts],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats() {
  return useContext(StatsContext);
}
