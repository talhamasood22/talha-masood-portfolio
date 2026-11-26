"use client";

import { useEffect, useState } from "react";

const SECTIONS = ["hero", "about", "experience", "graph", "projects", "contact"];

/**
 * A tmux/vim-style status line pinned to the bottom of the mockup: the file
 * you're "in" follows the section on screen, and the clock is Stuttgart time
 * so a visitor can see what time it is in Stuttgart.
 */
export function StatusBar() {
  const [section, setSection] = useState("hero");
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((el) => observer.observe(el));

    const onScroll = () => {
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
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(clock);
    };
  }, []);

  const position =
    progress <= 0 ? "Top" : progress >= 100 ? "Bot" : `${progress}%`;

  return (
    <div className="term-status" aria-hidden="true">
      <span className="term-status__mode">NORMAL</span>
      <span className="term-status__seg">
        <span className="term-status__branch">⎇ main</span>
      </span>
      <span className="term-status__file">~/portfolio/{section}.tsx</span>
      <span className="term-status__spacer" />
      <span className="term-status__seg term-status__wide">utf-8</span>
      <span className="term-status__seg term-status__wide">tsx</span>
      <span className="term-status__seg">Stuttgart {time}</span>
      <span className="term-status__pos">{position}</span>
    </div>
  );
}
