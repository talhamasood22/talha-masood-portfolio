import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { OrgLogo } from "@/components/OrgLogo";
import { education } from "@/data/portfolio";

export function EducationSection() {
  return (
    <section id="education" aria-labelledby="education-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader headingId="education-heading" title="Education" />

        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {education.map((edu) => {
            const modules = (edu.keyModules ?? []).filter((m) => m.highlight);
            return (
              <article
                key={edu.id}
                aria-labelledby={`${edu.id}-title`}
                className="border-t border-hairline pt-6"
              >
                <div className="flex items-start gap-4">
                  {edu.logo && <OrgLogo logo={edu.logo} size={48} />}
                  <div className="min-w-0">
                    <h3
                      id={`${edu.id}-title`}
                      className="text-h3 font-semibold text-ink text-balance"
                    >
                      {edu.degree}
                    </h3>
                    <p className="mt-1 text-small text-ink">{edu.institution}</p>
                  </div>
                </div>
                <p className="meta mt-1">
                  {edu.period}
                  <br />
                  {edu.location}
                </p>

                {edu.gradeInfo && (
                  <p className="mt-4 text-small font-medium text-accent">
                    {edu.gradeInfo}
                  </p>
                )}

                <p className="mt-2 max-w-[62ch] text-small text-muted text-pretty">
                  {edu.description}
                </p>

                {modules.length > 0 && (
                  <table className="mt-5 w-full max-w-[62ch] text-small">
                    <caption className="meta pb-1 text-left">
                      Selected modules
                    </caption>
                    <thead className="sr-only">
                      <tr>
                        <th scope="col">Module</th>
                        <th scope="col">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((m) => (
                        <tr key={m.name} className="border-t border-hairline">
                          <td className="py-2 pr-4 text-muted">{m.name}</td>
                          <td className="py-2 text-right font-medium text-ink tabular-nums">
                            {m.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
