import type { ThemePref } from "./theme";

const KEY = "duo-prefs";

export type Prefs = {
  sound: boolean;
  speech: boolean;
  simulateDate: string;
  theme: ThemePref;
};

const defaults: Prefs = { sound: true, speech: true, simulateDate: "", theme: "system" };

export function getPrefs(): Prefs {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Prefs>;
    const theme: ThemePref =
      stored.theme === "light" || stored.theme === "dark" || stored.theme === "system"
        ? stored.theme
        : "system";
    return { ...defaults, ...stored, theme };
  } catch {
    return defaults;
  }
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...getPrefs(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("duo-prefs"));
  return next;
}
