"use client";

import React from "react";
import { scrollToHash } from "@/lib/scroll";

/**
 * An in-page #link that eases to its target instead of relying on CSS
 * smooth scrolling, which some engines turn into a near-instant jump over
 * long distances (the graph sits far below the hero, past Experience).
 * Modified clicks (new tab, etc.) keep the browser's default.
 */
export function SmoothHashLink({
  href,
  onClick,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !href.startsWith("#")
        ) {
          return;
        }
        if (scrollToHash(href)) event.preventDefault();
      }}
      {...props}
    />
  );
}
