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
 * 2. Vim-style keys: j / k jump to the next / previous section. Ignored
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
      const next =
        event.key === "j"
          ? Math.min(targets.length - 1, current + 1)
          : Math.max(0, current - 1);
      if (next === current) return;

      event.preventDefault();
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
