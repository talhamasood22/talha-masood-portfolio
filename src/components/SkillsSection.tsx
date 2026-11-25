import React from "react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/SectionHeader";
import { skills } from "@/data/portfolio";

export function SkillsSection() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader headingId="skills-heading" title="Skills" />

        <dl className="mt-10">
          {skills.map((group) => (
            <div
              key={group.id}
              className="grid gap-3 border-t border-hairline py-5 md:grid-cols-12 md:items-baseline md:gap-8"
            >
              <dt className="text-small font-semibold text-ink md:col-span-4">
                {group.category}
              </dt>
              <dd className="flex flex-wrap gap-1.5 md:col-span-8">
                {group.skills.map((skill) => (
                  <Badge key={skill}>
                    {skill}
                  </Badge>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
