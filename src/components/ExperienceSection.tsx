"use client";

import React, { useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { SmoothHashLink } from "@/components/SmoothHashLink";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OrgLogo } from "@/components/OrgLogo";
import { experiences, sectionLedes } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const STEPS = experiences.length;

/**
 * Sticky Experience.
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
export function ExperienceSection() {
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
      className="section exp"
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
              {/* Rail: every company at a glance, with progress. It is also the
                  control, so keyboard and touch users can jump to a role. */}
              <nav aria-label="Roles" className="exp__rail lg:col-span-3">
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
                        {exp.logo && (
                          <OrgLogo logo={exp.logo} size={36} className="exp__rail-logo" />
                        )}
                        <span className="exp__rail-company">{exp.company}</span>
                        <span className="exp__rail-period meta">{exp.period}</span>
                        <span aria-hidden="true" className="exp__rail-line" />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <ol className="exp__cards lg:col-span-9">
                {experiences.map((exp, i) => (
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
                    <article className="rounded-panel border border-hairline bg-panel p-5 sm:p-6">
                      <div className="exp__card-head mb-4">
                        <p className="flex items-center gap-3 text-lg font-semibold leading-snug text-ink">
                          {exp.logo && <OrgLogo logo={exp.logo} size={36} />}
                          {exp.company}
                        </p>
                      </div>

                      {/* The facts a recruiter scans for, each on its own
                          labelled line: what the job was, when, and where. */}
                      <dl className="exp__facts">
                        <dt>Role</dt>
                        <dd>
                          <h3 className="text-h3 font-semibold text-ink text-balance">
                            {exp.role}
                          </h3>
                        </dd>
                        <dt>Date</dt>
                        <dd>{exp.period}</dd>
                        <dt>Where</dt>
                        <dd>
                          {exp.location}
                          {exp.employmentType && ` · ${exp.employmentType.toLowerCase()}`}
                        </dd>
                      </dl>
                      {/* The role as a short story: the first paragraph sets
                          the scene, the rest is what he did there. */}
                      <div className="exp__measure mt-4 max-w-[66ch] space-y-3">
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

                      {exp.link && (
                        <SmoothHashLink
                          href={exp.link.href}
                          className="focus-ring mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip text-small font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
                        >
                          {exp.link.label}
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </SmoothHashLink>
                      )}

                      {exp.externalLinks && exp.externalLinks.length > 0 && (
                        <p className="mt-3 flex flex-wrap gap-x-5">
                          {exp.externalLinks.map((link) => (
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

                      {exp.techStack.length > 0 && (
                        <ul
                          aria-label="Stack"
                          className="exp__measure mt-5 flex max-w-[66ch] flex-wrap gap-1.5"
                        >
                          {exp.techStack.map((tech) => (
                            <li key={tech}>
                              <Badge>{tech}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </li>
                ))}
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
