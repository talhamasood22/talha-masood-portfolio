import React from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { SkillIcon } from "@/components/SkillIcon";
import { skills } from "@/data/portfolio";

/**
 * One panel per skill group, two to a row on wide screens: the group name,
 * a line on where it comes from, then a chip for each tool with its logo.
 * Logos stay monochrome so the page keeps its single blue accent; a chip's
 * logo takes the accent on hover.
 */
export function SkillsSection() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader headingId="skills-heading" title="Skills" />

        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
          {skills.map((group) => (
            <Card key={group.id} coreClassName="flex flex-col gap-4 p-6 md:p-7">
              <div>
                <h3 className="font-heading text-h3 text-ink">{group.category}</h3>
                <p className="mt-1.5 max-w-[56ch] text-small text-muted text-pretty">
                  {group.summary}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label={`${group.category} skills`}>
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className="group/skill inline-flex items-center gap-2 rounded-chip border border-hairline bg-panel-raised/50 px-2.5 py-1.5 font-mono text-[0.8125rem] leading-none text-muted transition-colors hover:border-hairline-strong hover:text-ink"
                  >
                    <SkillIcon
                      name={skill}
                      className="h-4 w-4 shrink-0 text-faint transition-colors group-hover/skill:text-accent"
                    />
                    {skill}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
