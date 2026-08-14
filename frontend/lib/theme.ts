export type ThemePref = "system" | "light" | "dark";

export const THEME_OPTIONS: { id: ThemePref; label: string; hint: string }[] = [
  { id: "system", label: "System default", hint: "Match your device setting" },
  { id: "light", label: "Off", hint: "Always use light mode" },
  { id: "dark", label: "On", hint: "Always use dark mode" },
];

export function resolveDark(pref: ThemePref): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(pref: ThemePref) {
  document.documentElement.classList.toggle("dark", resolveDark(pref));
}
