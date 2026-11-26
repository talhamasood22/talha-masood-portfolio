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
 * Two small behaviours for the mockup page, with no UI of their own:
 *
 * 1. The site header links point at the home page ("/#about", "/"). Here
 *    they would leave the mockup for the live design, so clicks on them are
 *    kept on this page and scroll to the section instead.
 * 2. Vim-style keys: j / k jump to the next / previous section, stepping
 *    through the Experience roles on the way. Ignored
 *    while typing in a field or with a modifier held, so it never gets in
 *    the way.
 */
export function MockupNav() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (href === "/") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        return;
      }
      const match = href?.match(/^\/#([\w-]+)$/);
      const target = match && document.getElementById(match[1]);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      }
    };

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

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
