export const THEME_OVERRIDE_COOKIE = "sb_theme_override";

export type ThemeMode = "dark" | "light";
export type ThemeOverrideSelection = ThemeMode | "default";

export const DEFAULT_THEME_MODE: ThemeMode = "light";

export function normalizeThemeSelection(selection: ThemeOverrideSelection): ThemeMode {
  if (selection === "light" || selection === "dark") return selection;
  return DEFAULT_THEME_MODE;
}

export function normalizeThemeCookie(value: string | undefined | null): ThemeMode {
  if (value === "light") return "light";
  if (value === "dark") return "dark";
  return DEFAULT_THEME_MODE;
}

function getDocumentElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.documentElement;
}

export function applyThemeModeClass(mode: ThemeMode) {
  const root = getDocumentElement();
  if (!root) return;
  root.classList.toggle("dark", mode === "dark");
}


