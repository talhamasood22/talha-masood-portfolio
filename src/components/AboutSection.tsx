import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { aboutInfo } from "@/data/portfolio";

export function AboutSection() {
  const [lead, ...rest] = aboutInfo.narrative;

  return (
    <section id="about" aria-labelledby="about-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader headingId="about-heading" title="About" />

        <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8 md:col-start-5">
            {lead && (
              <p className="max-w-[60ch] text-lede text-ink text-pretty">{lead}</p>
            )}
            {rest.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-5 max-w-[60ch] text-base leading-relaxed text-muted text-pretty"
              >
                {paragraph}
              </p>
            ))}

            {/* What he likes working on, as a ruled list rather than three cards. */}
            <dl className="mt-10 grid gap-x-6 sm:grid-cols-3">
              {aboutInfo.pillars.map(({ title, description }) => (
                <div key={title} className="border-t border-hairline py-4">
                  <dt className="text-small font-semibold text-ink">{title}</dt>
                  <dd className="mt-1 text-small text-muted">{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
