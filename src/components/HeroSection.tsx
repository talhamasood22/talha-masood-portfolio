import React from "react";
import { ArrowDown, Download } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Availability } from "@/components/Availability";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TrackedCvLink } from "@/components/TrackedCvLink";
import { SmoothHashLink } from "@/components/SmoothHashLink";
import { personalInfo } from "@/data/portfolio";

/**
 * The opening screen: who, and in one first-person line what he builds and
 * for whom. The proof lives in the sections below, told once.
 *
 * The name is a plain <h1> in normal flow. On large screens the name and the
 * title under it travel and shrink into the pill at the top centre as you
 * scroll (SiteHeader drives it). On small screens the title fades as it goes
 * under the floating bar and the bar's own copy of the name rises in.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100svh-var(--header-h))] items-center pt-10 pb-16 md:pt-12 md:pb-20 lg:pt-[calc(var(--header-h)+2.5rem)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Full width on its own row: the name is the one loud thing, with
            what he does directly under it. */}
        <h1
          id="hero-heading"
          className="hero-title font-display text-display text-ink sm:whitespace-nowrap"
        >
          {/* On large screens these two spans travel into the name pill as
              the page scrolls (see SiteHeader). */}
          <span id="hero-name" className="hero-morph">
            {personalInfo.name}
          </span>
        </h1>
        <p className="mt-3 font-heading text-h2 text-accent sm:mt-4">
          <span id="hero-role" className="hero-morph">
            {personalInfo.title}
          </span>
        </p>

        <div className="mt-8 grid gap-12 md:grid-cols-12 md:gap-8 lg:mt-10 lg:gap-10">
          <div className="md:col-span-7 lg:col-span-8">
            <p className="max-w-[52ch] text-lede text-ink text-pretty">
              {personalInfo.headline}
            </p>
            {/* Start date and location, on the first screen on every device:
                what a recruiter screens on before anything else. */}
            <Availability className="mt-4" />
            <SmoothHashLink
              href="#graph"
              className="focus-ring font-ui mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip text-small font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
            >
              Try the graph I redesigned
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </SmoothHashLink>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href="#contact" variant="primary" size="lg">
                Get in touch
              </ButtonLink>
              <TrackedCvLink
                href={personalInfo.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                icon={<Download className="h-4 w-4" aria-hidden="true" />}
              >
                Download CV
              </TrackedCvLink>
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-4 lg:-mt-2">
            <ProfileAvatar />
          </div>
        </div>
      </div>
    </section>
  );
}
