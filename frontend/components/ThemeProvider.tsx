"use client";

import { useEffect } from "react";
import { getPrefs } from "@/lib/prefs";
import { applyTheme } from "@/lib/theme";
import { preloadVoices } from "@/lib/sound";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getPrefs().theme);
    preloadVoices();

    const onPrefs = () => applyTheme(getPrefs().theme);
    window.addEventListener("duo-prefs", onPrefs);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (getPrefs().theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onScheme);

    return () => {
      window.removeEventListener("duo-prefs", onPrefs);
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  return children;
}
