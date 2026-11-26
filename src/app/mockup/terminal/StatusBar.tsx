"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  "hero",
  "about",
  "experience",
  "graph",
  "projects",
  "contact",
];

/**
 * A vim-style status line pinned to the bottom of the mockup. Only what
 * carries information: where you are on the page, how far down, and the time
 * in Stuttgart.
 */
export function StatusBar() {
  const [section, setSection] = useState("hero");
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    // The section under a reading line 45% down the screen. Measured on
    // scroll rather than with an observer, so a jump (nav click, anchor)
    // never leaves it showing the previous section.
    const onScroll = () => {
      const line = window.innerHeight * 0.45;
      let current = targets[0]?.id ?? "hero";
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setSection(current);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const clock = window.setInterval(tick, 30_000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(clock);
    };
  }, []);

  // Plain percentage rather than vim's Top/Bot, which reads as jargon.
  const position = `${progress}%`;

  return (
    <div className="term-status" aria-hidden="true">
      <span className="term-status__mode">
        {section === "hero" ? "home" : section}
      </span>
      <span className="term-status__spacer" />
      <span className="term-status__keys">
        <kbd>j</kbd> next · <kbd>k</kbd> previous
      </span>
      <span className="term-status__seg">Stuttgart {time}</span>
      <span className="term-status__pos">{position}</span>
    </div>
  );
}
