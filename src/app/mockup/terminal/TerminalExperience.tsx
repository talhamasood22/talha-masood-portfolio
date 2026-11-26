"use client";

import React, { useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { SmoothHashLink } from "@/components/SmoothHashLink";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { experiences, sectionLedes } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const STEPS = experiences.length;

/** Stable short "commit hash" per role, so it never changes between renders. */
function shortHash(id: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** Branch-style slug for a company: "Mercedes-Benz AG" -> "mercedes-benz-ag". */
function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Terminal-mockup copy of the Experience section: the same scroll and pinning
 * behaviour, with the work history shown as git history. The rail is
 * `git log --graph`, each role is `git show <hash>`.
 *
 * Original notes — Sticky Experience.
 *
 * Desktop (lg, tall enough viewport): the section owns a runway and pins a
 * stage under the site header. The roles cross-fade in place as you scroll,
 * and the rail on the left lists every company with a fill line showing how
 * far through each role you are, so a skimmer sees all of them up front.
 *
 * Phones and tablets: the roles stay in a normal list (nothing is trapped
 * behind a pinned box), the same rail sticks under the header as a compact
 * progress bar, and each card rises in as it enters the screen.
 *
 * Reduced motion: the plain list, no pinning and no entrance.
 *
 * Progress is written to CSS variables per animation frame; React only
 * re-renders when the active role changes.
 */
export function TerminalExperience() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const runway = runwayRef.current;
    const rail = railRef.current;
    if (!runway || !rail) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = runway.getBoundingClientRect();
      const { distance, pinTop } = pinMetrics(runway);
      let progress: number;
      let index: number;

      if (distance > 0 && isPinned()) {
        // Pinned stage: how far it has travelled while stuck picks the role.
        progress = clamp((pinTop - rect.top) / distance);
        index = Math.min(STEPS - 1, Math.floor(progress * STEPS));
      } else {
        // List mode: the role whose card has crossed the reading line.
        const line = window.innerHeight * 0.45;
        index = 0;
        cardRefs.current.forEach((card, i) => {
          if (card && card.getBoundingClientRect().top < line) index = i;
        });
        const first = cardRefs.current[0]?.getBoundingClientRect();
        const last = cardRefs.current[STEPS - 1]?.getBoundingClientRect();
        progress =
          first && last
            ? clamp((line - first.top) / Math.max(1, last.bottom - first.top))
            : 0;
      }

      // Per-role fill (0 → 1) for each rail item's line.
      rail.querySelectorAll<HTMLElement>("[data-step]").forEach((item, i) => {
        item.style.setProperty("--fill", clamp(progress * STEPS - i).toFixed(3));
      });

      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const goTo = (index: number) => {
    const runway = runwayRef.current;
    if (!runway) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isPinned()) {
      const { distance, pinTop } = pinMetrics(runway);
      const top = runway.getBoundingClientRect().top + window.scrollY - pinTop;
      window.scrollTo({
        top: top + ((index + 0.5) / STEPS) * distance,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      cardRefs.current[index]?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    }
  };

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section exp texp"
    >
      <div
        ref={runwayRef}
        className="exp__runway"
        style={{ "--steps": STEPS } as React.CSSProperties}
      >
        <div className="exp__stage">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              headingId="experience-heading"
              title="Experience"
              lede={sectionLedes.experience}
            />

            <div className="exp__grid mt-6 lg:grid lg:grid-cols-12 lg:gap-12">
              {/* Rail: `git log --graph`. Still the control for jumping to a
                  role, and still shows how far through each one you are. */}
              <nav aria-label="Roles" className="exp__rail lg:col-span-3">
                <p className="texp__cmd" aria-hidden="true">
                  <span className="term-prompt">$</span>git log --graph
                </p>
                <ol ref={railRef} className="exp__rail-list">
                  {experiences.map((exp, i) => (
                    <li key={exp.id} data-step={i} className="exp__rail-item">
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={i === active ? "step" : undefined}
                        className={cn(
                          "focus-ring exp__rail-button",
                          i === active ? "text-ink" : "text-faint hover:text-muted"
                        )}
                      >
                        <span aria-hidden="true" className="texp__node" />
                        <span className="texp__hash" aria-hidden="true">
                          {shortHash(exp.id)}
                          {i === 0 && <span className="texp__ref"> HEAD</span>}
                        </span>
                        <span className="exp__rail-company">{exp.company}</span>
                        <span className="exp__rail-period meta">{exp.period}</span>
                        <span aria-hidden="true" className="exp__rail-line" />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <ol className="exp__cards lg:col-span-9">
                {experiences.map((exp, i) => {
                  const hash = shortHash(exp.id);
                  const branch = slug(exp.company);
                  return (
                    <li
                      key={exp.id}
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      data-state={
                        i === active ? "active" : i < active ? "before" : "after"
                      }
                      className="exp__card"
                    >
                      <article className="texp__window">
                        <div className="term-titlebar" aria-hidden="true">
                          <span className="term-dots">
                            <i />
                            <i />
                            <i />
                          </span>
                          <span className="term-path">
                            ~/experience — git show {hash}
                          </span>
                        </div>

                        <div className="texp__body">
                          {/* git show header: the commit, its refs, then the
                              role, dates and place as header fields. */}
                          <p className="texp__commit">
                            <span aria-hidden="true">commit </span>
                            <span className="texp__sha" aria-hidden="true">
                              {hash}
                            </span>{" "}
                            <span className="texp__refs">
                              (
                              {i === 0 && (
                                <>
                                  <span className="texp__head">HEAD -&gt; </span>
                                </>
                              )}
                              <span className="texp__branch">{branch}</span>)
                            </span>
                          </p>
                          <dl className="texp__fields">
                            <dt>Role:</dt>
                            <dd>
                              <h3 className="texp__role">{exp.role}</h3>
                            </dd>
                            <dt>Date:</dt>
                            <dd>{exp.period}</dd>
                            <dt>Where:</dt>
                            <dd>
                              {exp.location}
                              {exp.employmentType &&
                                ` · ${exp.employmentType.toLowerCase()}`}
                            </dd>
                          </dl>

                          {/* The message, indented like a commit body. The
                              first paragraph is the subject line. */}
                          <div className="texp__message exp__measure max-w-[66ch] space-y-3">
                            {exp.story.map((paragraph, p) => (
                              <p
                                key={paragraph}
                                className={cn(
                                  "text-pretty",
                                  p === 0
                                    ? "text-base leading-relaxed text-ink"
                                    : "text-small text-muted"
                                )}
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>

                          {(exp.link ||
                            (exp.externalLinks && exp.externalLinks.length > 0)) && (
                            <p className="texp__links">
                              {exp.link && (
                                <SmoothHashLink
                                  href={exp.link.href}
                                  className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-chip text-small font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
                                >
                                  {exp.link.label}
                                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                                </SmoothHashLink>
                              )}
                              {exp.externalLinks?.map((link) => (
                                <a
                                  key={link.href}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="focus-ring inline-flex min-h-[44px] items-center gap-1 rounded-chip text-small font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
                                >
                                  {link.label}
                                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span className="sr-only">(opens in a new tab)</span>
                                </a>
                              ))}
                            </p>
                          )}

                          {/* The stack as a diff stat: what the role added. */}
                          {exp.techStack.length > 0 && (
                            <div className="texp__diff">
                              <ul aria-label="Stack" className="texp__stack">
                                {exp.techStack.map((tech) => (
                                  <li key={tech}>
                                    <span aria-hidden="true">+ </span>
                                    {tech}
                                  </li>
                                ))}
                              </ul>
                              <p className="texp__stat" aria-hidden="true">
                                {exp.techStack.length} tools changed,{" "}
                                <span className="texp__plus">
                                  {exp.techStack.length} insertions(+)
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
        {/* Scroll distance the stage stays pinned for (zero in list mode). */}
        <div aria-hidden="true" className="exp__spacer" />
      </div>
    </section>
  );
}

/** Same query as the pinned layout in globals.css. */
function isPinned() {
  return window.matchMedia(
    "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)"
  ).matches;
}

/**
 * The scroll distance the stage stays pinned for (runway minus stage), and
 * the viewport offset it sticks at (its CSS `top`).
 */
function pinMetrics(runway: HTMLElement) {
  const stage = runway.firstElementChild as HTMLElement | null;
  const stageHeight = stage?.offsetHeight ?? 0;
  const pinTop = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
  return { distance: runway.offsetHeight - stageHeight, pinTop };
}

function clamp(n: number) {
  return Math.min(1, Math.max(0, n));
}
