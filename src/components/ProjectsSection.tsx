import React from "react";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { CadModelChips, CadResults } from "@/components/CadResults";
import { projects, type ProjectItem } from "@/data/portfolio";

/** "Reasoning agent: works out…" → ["Reasoning agent", "works out…"] */
function splitStage(text: string): [string, string] {
  const at = text.indexOf(":");
  if (at === -1) return ["", text];
  return [text.slice(0, at).trim(), text.slice(at + 1).trim()];
}

function ProjectLinks({ project }: { project: ProjectItem }) {
  const links = [
    project.demoUrl && { href: project.demoUrl, label: "Live demo" },
    project.githubUrl && { href: project.githubUrl, label: "Source" },
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
      {links.map((link) => (
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
  );
}

/**
 * The featured project gets the one panel on the page, with its pipeline
 * laid out in order. Everything else is a ruled entry in a grid that takes
 * however many projects there are.
 */
export function ProjectsSection() {
  const featured = projects.filter((p) => p.isFeatured);
  const rest = projects.filter((p) => !p.isFeatured);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader headingId="projects-heading" title="Projects" />

        {featured.map((project) => (
          <article
            key={project.id}
            aria-labelledby={`${project.id}-title`}
            className="mt-10 grid gap-8 rounded-panel border border-hairline bg-panel p-6 md:grid-cols-12 md:p-9"
          >
            <div className="md:col-span-7">
              <p className="meta">
                <span className="font-medium text-accent">Featured</span>
                <span aria-hidden="true" className="mx-2">/</span>
                {project.category}
              </p>
              <h3
                id={`${project.id}-title`}
                className="mt-3 font-heading text-[clamp(1.375rem,1.1rem+1vw,1.75rem)] leading-tight text-ink text-balance"
              >
                {project.title}
              </h3>
              <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted text-pretty">
                {project.summary}
              </p>
              {project.role && (
                <p className="mt-3 max-w-[62ch] text-base font-medium leading-relaxed text-ink text-pretty">
                  {project.role}
                </p>
              )}
              {project.id === "multi-agent-cad" && <CadModelChips />}
              <ProjectLinks project={project} />
            </div>

            <div className="md:col-span-5">
              {project.architecture && project.architecture.length > 0 && (
                <>
                  <h4 className="text-small font-semibold text-ink">
                    How it works
                  </h4>
                  {/* Genuinely ordered, so the numbers are information. */}
                  <ol className="mt-3 border-l border-hairline-strong">
                    {project.architecture.map((stage, i) => {
                      const [name, detail] = splitStage(stage);
                      return (
                        <li key={stage} className="relative pb-5 pl-6 last:pb-0">
                          <span
                            aria-hidden="true"
                            className="absolute -left-[0.8125rem] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-hairline-strong bg-panel text-[0.75rem] font-semibold text-accent tabular-nums"
                          >
                            {i + 1}
                          </span>
                          {name && (
                            <span className="block text-small font-medium text-ink">
                              {name}
                            </span>
                          )}
                          <span className="block text-small text-muted first-letter:uppercase">
                            {detail}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}

              <dl className="mt-8 space-y-3 border-t border-hairline pt-5">
                {project.metrics && (
                  <div>
                    <dt className="meta">Compared</dt>
                    <dd className="text-small text-ink">{project.metrics}</dd>
                  </div>
                )}
                <div>
                  <dt className="meta">Stack</dt>
                  <dd className="text-small text-muted">
                    {project.techStack.join(", ")}
                  </dd>
                </div>
              </dl>
            </div>

            {project.id === "multi-agent-cad" && <CadResults />}
          </article>
        ))}

        {rest.length > 0 && (
          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {rest.map((project) => (
              <article
                key={project.id}
                aria-labelledby={`${project.id}-title`}
                className="flex flex-col border-t border-hairline pt-6"
              >
                <p className="meta">{project.category}</p>
                <h3
                  id={`${project.id}-title`}
                  className="mt-2 text-h3 font-semibold text-ink text-balance"
                >
                  {project.title}
                </h3>
                <p className="mt-3 max-w-[62ch] text-small text-muted text-pretty">
                  {project.summary}
                </p>
                <p className="meta mt-4">
                  <span className="sr-only">Stack: </span>
                  {project.techStack.join(", ")}
                </p>
                <ProjectLinks project={project} />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
