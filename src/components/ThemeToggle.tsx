"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_CHROME, type Theme } from "@/lib/theme";

/* The theme lives on <html data-theme>. The layout's inline script sets it
   before first paint (stored choice, else the OS preference), so this reads
   it from there rather than mirroring it in state. */
const readTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
};

/** Light/dark switch. Saves the choice and recolours the browser chrome. */
export function ThemeToggle() {
  // The server cannot know the visitor's preference, so it renders "dark".
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);

  // The viewport export emits one theme-color meta per colour scheme; all of
  // them must follow the active theme, not the OS setting. Done after
  // hydration so React's own <head> tags are never edited before it owns them.
  useEffect(() => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", THEME_CHROME[theme]));
  }, [theme]);

  const apply = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;

    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Private mode without storage: the choice still holds for this page.
    }
  };

  const next: Theme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-chip text-faint transition-colors hover:bg-panel-raised hover:text-ink"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
