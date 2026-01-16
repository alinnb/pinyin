export type Theme = "light" | "dark";

const THEME_KEY = "pinyin_theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "light";
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  } catch {}
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next = current === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function initTheme(): void {
  const theme = getTheme();
  applyTheme(theme);
}