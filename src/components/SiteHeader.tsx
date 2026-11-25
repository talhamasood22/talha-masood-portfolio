"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Download, Menu, X } from "lucide-react";
import { NAV_ITEMS, personalInfo } from "@/data/portfolio";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const DRAWER_ID = "site-navigation";
const HERO_TITLE_ID = "hero-heading";

const noopSubscribe = () => () => {};

/**
 * An eased scroll back to the top. The browser's own smooth scroll is
 * near-instant over long distances in some engines, so this drives it: the
 * duration grows with the distance (0.6–1.2 s), and any wheel, touch or key
 * input from the visitor hands control straight back to them.
 */
function scrollToTop() {
  const start = window.scrollY;
  if (start <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }

  const duration = Math.min(1200, Math.max(600, start * 0.25));
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  // Each step is placed exactly; CSS smooth scrolling would smooth it again.
  html.style.scrollBehavior = "auto";

  let frame = 0;
  const begin = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    html.style.scrollBehavior = previous;
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };

  const step = (now: number) => {
    const t = Math.min(1, (now - begin) / duration);
    // easeInOutCubic: gentle start, quick middle, soft landing.
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: start * (1 - e), behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  frame = requestAnimationFrame(step);
}

/** Section links point at the home page, so they also work from the 404. */
const toHome = (href: string) => (href.startsWith("#") ? `/${href}` : href);

/**
 * The site masthead.
 *
 * A sticky bar with the name on the left and the sections on the right. The
 * name is hidden while the hero's own title is on screen, and rises into the
 * bar once that title has scrolled up underneath it (see `.site-header` in
 * globals.css). Docking is a single boolean from an IntersectionObserver, so
 * nothing is measured or positioned on scroll frames.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const dockNameRef = useRef<HTMLSpanElement>(null);
  const dockRoleRef = useRef<HTMLSpanElement>(null);

  // Only a page with a hero title hands the name off; anywhere else (the
  // 404) the name is in the bar from the start. The server assumes a hero.
  const hasHero = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(HERO_TITLE_ID) !== null,
    () => true
  );
  const [heroGone, setHeroGone] = useState(false);
  // Large screens with motion: the hero name and title travel into the pill
  // and the pill is "docked" exactly when they arrive (see the morph effect).
  const [morph, setMorph] = useState(false);
  const [morphArrived, setMorphArrived] = useState(false);
  const docked = !hasHero || (morph ? morphArrived : heroGone);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dock the name once the hero title has gone under the bar.
  useEffect(() => {
    const title = document.getElementById(HERO_TITLE_ID);
    if (!title) return;

    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      // The space the bar takes at the top (floating bar on small screens,
      // the name dock on large ones), from the same CSS variable the layout
      // uses.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const barHeight =
        (parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h")
        ) || 0) * rem;
      observer = new IntersectionObserver(
        ([entry]) => {
          // Docked when less than half of the title is still visible below
          // the bar *and* it left upwards (not off the bottom of the screen).
          const above = entry.boundingClientRect.top < barHeight;
          setHeroGone(above && entry.intersectionRatio < 0.5);
        },
        {
          rootMargin: `-${barHeight}px 0px 0px 0px`,
          threshold: [0, 0.5, 1],
        }
      );
      observer.observe(title);
    };

    observe();
    // The bar is taller at desktop sizes; re-arm with the new offset.
    const query = window.matchMedia("(min-width: 1024px)");
    query.addEventListener("change", observe);

    return () => {
      observer?.disconnect();
      query.removeEventListener("change", observe);
    };
  }, [hasHero]);

  // The morph. The hero's name and title move and shrink from where they sit
  // in the hero to the matching text in the pill, scrubbed by scroll. Both
  // ends are measured from layout (never from a transformed box) on load,
  // resize and font load; scroll frames only interpolate between them. When
  // they arrive, the pill's own text takes over and the hero's is hidden.
  useEffect(() => {
    const name = document.getElementById("hero-name");
    const role = document.getElementById("hero-role");
    const dock = dockRef.current;
    const dockName = dockNameRef.current;
    const dockRole = dockRoleRef.current;
    if (!name || !role || !dock || !dockName || !dockRole) return;

    const query = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
    );

    type Path = { L: number; T: number; W: number; H: number; tx: number; ty: number; tw: number; th: number };
    let paths: Path[] = [];
    let distance = 1;
    let frame = 0;
    let arrived = false;
    const items = [name, role];

    // Layout position of an element inside the fixed dock, ignoring the
    // transforms the dock uses for its own entrance.
    const inDock = (el: HTMLElement) => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== dock) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x: x + dock.offsetLeft, y: y + dock.offsetTop };
    };

    // Where scroll-driven animations exist, the whole trip runs as CSS
    // keyframes on the page's scroll timeline, on the compositor, in step
    // with the scroll. Elsewhere (Firefox today) it is applied per frame.
    const cssDriven =
      typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");
    const root = document.documentElement;
    let sheet: HTMLStyleElement | null = null;

    const reset = () => {
      for (const el of items) {
        el.style.transform = "";
        el.style.visibility = "";
      }
      dock.style.removeProperty("--dock-bg");
      delete root.dataset.morph;
      root.style.removeProperty("--morph-d");
    };

    // Where a travelling element is at progress p of its trip, given the page
    // is scrolled to scrollY. It blends from where the text would naturally
    // be (moving up with the page) to its place in the pill, so early on it
    // scrolls with the content around it and never hangs over it, then curves
    // into the pill.
    const placeAt = (g: Path, p: number, scrollY: number, ex: number, ey: number) => {
      const e = p * p * (3 - 2 * p);
      const s = 1 + (g.tw / g.W - 1) * e;
      const naturalTop = g.T - scrollY;
      const x = g.L + (g.tx - g.L) * ex;
      // Blend vertical centres (natural → pill), so the line boxes line up.
      const fromCy = naturalTop + g.H / 2;
      const cy = fromCy + (g.ty + g.th / 2 - fromCy) * ey;
      return { x, top: cy - (g.H * s) / 2, s, naturalTop };
    };

    const toTransform = (g: Path, at: ReturnType<typeof placeAt>) =>
      `translate3d(${(at.x - g.L).toFixed(2)}px, ${(at.top - at.naturalTop).toFixed(2)}px, 0) scale(${at.s.toFixed(4)})`;

    // Both transforms at progress p. The title starts under the name and ends
    // beside it, so its horizontal target is the name's current right edge
    // (plus the gap it has in the pill): however the name is sized at that
    // moment, the title never runs into it. It also rises a little later.
    const transformsAt = (p: number, scrollY: number) => {
      const [nameG, roleG] = paths;
      const e = p * p * (3 - 2 * p);
      const name = placeAt(nameG, p, scrollY, e, e);
      const role = placeAt(roleG, p, scrollY, 0, Math.pow(e, 1.25));
      const gap = roleG.tx - (nameG.tx + nameG.tw);
      const besideName = name.x + nameG.W * name.s + gap;
      const ex = Math.min(1, e * 1.6);
      role.x = roleG.L + (besideName - roleG.L) * ex;
      return [toTransform(nameG, name), toTransform(roleG, role)];
    };

    // Bake the trip into keyframes: 24 samples of the eased path, with the
    // page's own scroll already accounted for, so the compositor only has to
    // interpolate between them.
    const writeKeyframes = () => {
      if (!sheet) {
        sheet = document.createElement("style");
        sheet.dataset.heroMorph = "";
        document.head.appendChild(sheet);
      }
      const steps = 24;
      const frames: string[][] = [[], []];
      for (let k = 0; k <= steps; k++) {
        const p = k / steps;
        transformsAt(p, p * distance).forEach((t, i) =>
          frames[i].push(`${(p * 100).toFixed(3)}%{transform:${t}}`)
        );
      }
      sheet.textContent = frames
        .map((list, i) => `@keyframes hero-morph-${i}{${list.join("")}}`)
        .join("\n");
      root.style.setProperty("--morph-d", `${distance.toFixed(1)}px`);
      root.dataset.morph = "";
    };

    const measure = () => {
      reset();
      const scrollY = window.scrollY;
      paths = [
        [name, dockName],
        [role, dockRole],
      ].map(([from, to]) => {
        const r = from.getBoundingClientRect();
        const t = inDock(to);
        return {
          L: r.left,
          T: r.top + scrollY,
          W: r.width,
          H: r.height,
          tx: t.x,
          ty: t.y,
          tw: to.offsetWidth,
          th: to.offsetHeight,
        };
      });
      // The trip lasts until the name's resting place would have scrolled
      // past the top of the screen.
      distance = Math.max(160, paths[0].T + paths[0].H);
    };

    const update = () => {
      frame = 0;
      // Small screens and reduced motion use the plain hand-off instead.
      if (!query.matches || paths.length === 0) return;
      const scrollY = window.scrollY;
      const p = Math.min(1, Math.max(0, scrollY / distance));

      if (!cssDriven) {
        transformsAt(p, scrollY).forEach((t, i) => {
          items[i].style.transform = t;
          items[i].style.visibility = p >= 1 ? "hidden" : "";
        });
        // The pill's surface gathers around the text over the last stretch.
        dock.style.setProperty(
          "--dock-bg",
          Math.min(1, Math.max(0, (p - 0.85) / 0.15)).toFixed(3)
        );
      }

      // Arrival decides whether the pill is a live link; it needs no
      // frame-perfect timing, the visuals above do.
      if ((p >= 1) !== arrived) {
        arrived = p >= 1;
        setMorphArrived(arrived);
      }
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    const remeasure = () => {
      if (!query.matches) return;
      measure();
      if (cssDriven) writeKeyframes();
      update();
    };

    const start = () => {
      setMorph(query.matches);
      if (!query.matches) {
        paths = [];
        reset();
        return;
      }
      remeasure();
    };

    start();
    document.fonts?.ready.then(remeasure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    query.addEventListener("change", start);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      query.removeEventListener("change", start);
      reset();
      sheet?.remove();
    };
  }, []);

  // Bar surface and the current section. Section offsets are cached and
  // re-measured whenever the page changes height, so scroll frames only
  // compare numbers.
  useEffect(() => {
    let offsets: { id: string; top: number }[] = [];
    let frame = 0;

    const measure = () => {
      offsets = NAV_ITEMS.map((item) => {
        const el = document.getElementById(item.id);
        return {
          id: item.id,
          top: el ? el.getBoundingClientRect().top + window.scrollY : Infinity,
        };
      });
    };

    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);

      const line = window.scrollY + window.innerHeight * 0.35;
      let current = "";
      for (const { id, top } of offsets) {
        if (top <= line) current = id;
      }
      // At the very bottom the last section is current even if it is short,
      // but only if it exists on this page (the 404 has no sections).
      const last = offsets[offsets.length - 1];
      if (
        last &&
        Number.isFinite(last.top) &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
      ) {
        current = last.id;
      }
      setActiveSection(current);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    measure();
    update();

    const resize = new ResizeObserver(() => {
      measure();
      schedule();
    });
    resize.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  // Close the drawer if the viewport grows past the breakpoint.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (query.matches) setIsMenuOpen(false);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Lock scrolling, move focus into the drawer, keep Tab inside it, and
  // close on Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = drawerRef.current.contains(active);

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // On the home page the name glides back to the top; anywhere else (the
  // 404) it is an ordinary link home.
  const toTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== "/") return;
    event.preventDefault();
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    scrollToTop();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  };
  const sectionLinks = NAV_ITEMS.filter((item) => item.id !== "contact");
  const contactLink = NAV_ITEMS.find((item) => item.id === "contact");
  const activeIndex = sectionLinks.findIndex((item) => item.id === activeSection);

  return (
    <>
      {/* Small screens: a floating bar inset from the edges. The name rises
          into it once the hero title has scrolled away. */}
      <header
        ref={headerRef}
        className="site-header pointer-events-none sticky top-0 z-40 px-3 pt-3 lg:hidden"
        data-docked={docked}
        data-scrolled={scrolled || isMenuOpen}
      >
        <div className="nav-bar pointer-events-auto mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 rounded-panel pl-4 pr-1.5">
          {/* The docked name. Hidden from assistive tech while the hero's
              <h1> is the visible name, so it is never announced twice. */}
          <Link
            href="/"
            onClick={toTop}
            aria-label={`${personalInfo.name}, back to top`}
            aria-hidden={!docked}
            tabIndex={docked ? undefined : -1}
            className="focus-ring -mx-1 flex min-h-11 min-w-0 items-center rounded-chip px-1 font-display text-[1.1875rem] leading-none text-ink"
          >
            {/* The clip window the name rises through (see globals.css). */}
            <span className="site-header__name min-w-0">
              <span className="truncate">{personalInfo.name}</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            {contactLink && (
              <a
                href={toHome(contactLink.href)}
                aria-current={activeSection === "contact" ? "true" : undefined}
                className="focus-ring mr-1 hidden h-10 items-center rounded-chip bg-accent px-4 text-[0.9375rem] font-semibold text-on-accent transition-colors hover:bg-accent-soft sm:flex"
              >
                {contactLink.label}
              </a>
            )}

            <ThemeToggle />

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls={DRAWER_ID}
              aria-label="Open navigation menu"
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-chip text-muted transition-colors hover:bg-panel-raised hover:text-ink"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Large screens: once the hero title has scrolled away, the name
          settles into a small floating bar at the top centre of the page. */}
      <div
        ref={dockRef}
        className="site-dock pointer-events-none fixed inset-x-0 top-3 z-40 hidden justify-center lg:flex"
        data-docked={docked}
        data-morph={morph}
      >
        <Link
          href="/"
          onClick={toTop}
          aria-label={`${personalInfo.name}, ${personalInfo.title}. Back to top`}
          aria-hidden={!docked}
          tabIndex={docked ? undefined : -1}
          className="nav-dock focus-ring flex h-12 items-center gap-3 rounded-full px-6 text-ink"
        >
          <span className="site-header__name">
            <span ref={dockNameRef} className="font-display text-[1.375rem] leading-none">
              {personalInfo.name}
            </span>
          </span>
          <span aria-hidden="true" className="nav-dock__rule h-5 w-px bg-hairline-strong" />
          <span className="site-header__name">
            <span ref={dockRoleRef} className="font-heading text-[0.9375rem] leading-none text-accent">
              {personalInfo.title}
            </span>
          </span>
        </Link>
      </div>

      {/* Large screens: a floating panel in the left gutter, centred
          vertically, with a marker that slides to the current section. */}
      <aside
        className="nav-panel fixed left-5 top-1/2 z-40 hidden max-h-[calc(100dvh-2.5rem)] w-48 -translate-y-1/2 flex-col overflow-y-auto rounded-panel p-2 lg:flex"
        aria-label="Site"
      >
        <nav aria-label="Sections">
          <ul
            className="nav-panel__list relative"
            style={{ "--i": Math.max(activeIndex, 0) } as React.CSSProperties}
            data-has-active={activeIndex >= 0}
          >
            <span aria-hidden="true" className="nav-panel__marker" />
            {sectionLinks.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={toHome(item.href)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "focus-ring flex h-10 items-center rounded-chip pl-4 pr-2.5 text-[0.9375rem] font-medium transition-colors",
                      isActive ? "text-ink" : "text-faint hover:bg-panel-raised hover:text-ink"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-2 space-y-1.5 border-t border-hairline pt-3">
          <a
            href={personalInfo.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring flex h-10 items-center justify-center gap-1.5 rounded-chip border border-field-border text-[0.9375rem] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CV
          </a>
          {contactLink && (
            <a
              href={toHome(contactLink.href)}
              aria-current={activeSection === "contact" ? "true" : undefined}
              className="focus-ring flex h-10 items-center justify-center rounded-chip bg-accent text-[0.9375rem] font-semibold text-on-accent transition-colors hover:bg-accent-soft"
            >
              {contactLink.label}
            </a>
          )}
          <div className="flex items-center justify-between pl-2.5 pt-1">
            <span className="meta">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--scrim)] lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Drawer — inert while closed so its links stay out of the tab order */}
      <div
        ref={drawerRef}
        id={DRAWER_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!isMenuOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto overscroll-contain border-l border-hairline bg-page px-6 pb-6 transition-transform duration-300 ease-out lg:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between">
          <span className="font-display text-[1.1875rem] leading-none text-ink">
            {personalInfo.name}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            className="focus-ring -mr-2 flex h-11 w-11 items-center justify-center rounded-chip text-muted transition-colors hover:bg-panel-raised hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Sections menu" className="mt-4 border-t border-hairline">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className="border-b border-hairline">
                <a
                  href={toHome(item.href)}
                  onClick={closeMenu}
                  aria-current={activeSection === item.id ? "true" : undefined}
                  className={cn(
                    "focus-ring flex min-h-[52px] items-center rounded-chip text-lg font-medium transition-colors",
                    activeSection === item.id
                      ? "text-accent"
                      : "text-ink hover:text-accent"
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={personalInfo.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-auto flex min-h-[48px] w-full items-center justify-center gap-2 rounded-chip border border-hairline-strong text-[0.9375rem] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CV
        </a>
      </div>
    </>
  );
}
