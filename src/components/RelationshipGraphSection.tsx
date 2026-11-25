import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { OrgLogo } from "@/components/OrgLogo";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { graphShowcase } from "@/data/graph-showcase";
import { experiences } from "@/data/portfolio";

/**
 * Work sample: the relationship graph redesign from Proxima Fusion, rebuilt
 * on mock data with the same stack (React Flow and Dagre) so it can be used,
 * not just described. The company, role and dates come from the matching
 * experience entry, so they never drift from the Experience section.
 */
export function RelationshipGraphSection() {
  const company = experiences.find((e) => e.id === graphShowcase.companyId);

  return (
    <section id="graph" aria-labelledby="graph-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headingId="graph-heading"
          title={graphShowcase.title}
          lede={graphShowcase.lede}
        />

        {company && (
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-panel border border-hairline bg-panel px-5 py-4">
            {company.logo && <OrgLogo logo={company.logo} size={48} />}
            <div className="min-w-0">
              <p className="text-small text-faint">Built at</p>
              <p className="font-heading text-xl leading-tight text-ink">{company.company}</p>
            </div>
            <p className="text-small text-muted sm:ml-auto sm:text-right">
              {company.role}
              <br />
              <span className="text-faint">{company.period}</span>
            </p>
          </div>
        )}

        <dl className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {graphShowcase.points.map((point) => (
            <div key={point.label}>
              <dt className="text-small font-semibold text-ink">{point.label}</dt>
              <dd className="mt-1 text-small text-muted text-pretty">{point.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <RelationshipGraph
            caption={company ? `${company.company} task-run graph, mock data` : "Mock data"}
          />
        </div>
      </div>
    </section>
  );
}
