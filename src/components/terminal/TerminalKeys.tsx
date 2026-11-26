"use client";

import { useEffect } from "react";

const SECTIONS = [
  "hero",
  "about",
  "experience",
  "graph",
  "projects",
  "contact",
];

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/**
 * Vim keys for the terminal home page, with no UI of their own: j jumps to
 * the next section (down), k to the previous one (up), stepping through the
 * Experience roles on the way. Ignored while typing in a field, while the
 * menu is open, or with a modifier held, so it never gets in the way.
 */
export function TerminalKeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "j" && event.key !== "k") return;
      const el = event.target as HTMLElement | null;
      if (
        el?.closest("input, textarea, select, [contenteditable='true']") ||
        document.querySelector(
          "[role='dialog'][aria-modal='true']:not([inert])",
        )
      ) {
        return;
      }

      const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
        (node): node is HTMLElement => node !== null,
      );
      // The section whose top is closest above the reading line is "current".
      const line = window.innerHeight * 0.45;
      let current = 0;
      targets.forEach((node, i) => {
        if (node.getBoundingClientRect().top <= line) current = i;
      });
      // Inside Experience, step through the roles first, the same way
      // scrolling does, and only leave the section after the last (or before
      // the first) role.
      if (targets[current]?.id === "experience") {
        const roles = Array.from(
          document.querySelectorAll<HTMLButtonElement>(".exp__rail-button"),
        );
        const active = roles.findIndex((b) => b.hasAttribute("aria-current"));
        const step = event.key === "j" ? active + 1 : active - 1;
        if (active !== -1 && step >= 0 && step < roles.length) {
          event.preventDefault();
          roles[step].click();
          return;
        }
      }

      const next =
        event.key === "j"
          ? Math.min(targets.length - 1, current + 1)
          : Math.max(0, current - 1);
      if (next === current) return;

      event.preventDefault();
      // Coming back up into Experience lands on its last role, so k retraces
      // exactly what j did.
      if (event.key === "k" && targets[next].id === "experience") {
        const roles = document.querySelectorAll<HTMLButtonElement>(
          ".exp__rail-button",
        );
        if (roles.length > 0) {
          roles[roles.length - 1].click();
          return;
        }
      }
      if (next === 0) {
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
      } else {
        targets[next].scrollIntoView({
          behavior: scrollBehavior(),
          block: "start",
        });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
