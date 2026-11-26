import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ArrowDown, Download } from "lucide-react";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { RelationshipGraphSection } from "@/components/RelationshipGraphSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ContactSection } from "@/components/ContactSection";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TrackedCvLink } from "@/components/TrackedCvLink";
import { SmoothHashLink } from "@/components/SmoothHashLink";
import { personalInfo } from "@/data/portfolio";
import "./terminal.css";

/* Test mockup of a terminal-flavoured skin. Not linked from the site and kept
   out of search; the real page at / is unchanged. */

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Terminal theme mockup",
  robots: { index: false, follow: false },
};

/* Faint source behind the hero: real shapes from the stack, not lorem. */
const BACKDROP = `export async function listRuns(filter: RunFilter) {
  const res = await api.get<Run[]>("/runs", { params: filter });
  return res.data.filter((run) => run.status !== "archived");
}

@router.get("/runs/{run_id}/lineage")
async def lineage(run_id: UUID, db: Session = Depends(get_db)):
    graph = await build_lineage(db, run_id)
    return aggregate(graph, by=("target", "direction", "task_type"))

resource "google_cloud_run_v2_service" "preview" {
  name     = "pr-\${var.pr_number}"
  location = var.region
  template { containers { image = var.image } }
}

const nodes = useMemo(() => groupRuns(runs, { keepIndependent: true }), [runs]);
// 1,388 nodes -> 52

$ gh pr create --fill && gh pr checks --watch
✓ preview deployed in 4m 52s`;

export default function TerminalMockup() {
  return (
    <div className="skin-terminal">
      <style>{`body:has(.skin-terminal){--font-term:${mono.style.fontFamily};}`}</style>

      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative flex min-h-[calc(100svh-var(--header-h))] items-center overflow-hidden pt-10 pb-16 md:pt-12 md:pb-20 lg:pt-[calc(var(--header-h)+2.5rem)]"
      >
        <pre aria-hidden="true" className="term-backdrop">
          {BACKDROP}
        </pre>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-12 md:gap-8 lg:gap-10">
            <div className="term-window md:col-span-7 lg:col-span-8">
              <div className="term-titlebar" aria-hidden="true">
                <span className="term-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="term-path">talha@stuttgart: ~/portfolio</span>
                <span className="term-tab">zsh</span>
              </div>

              <div className="term-body">
                <p className="term-cmd" aria-hidden="true">
                  <span className="term-prompt">$</span> whoami
                </p>
                <h1
                  id="hero-heading"
                  className="hero-title term-name text-ink"
                >
                  <span id="hero-name" className="hero-morph">
                    {personalInfo.name}
                  </span>
                </h1>

                <p className="term-cmd" aria-hidden="true">
                  <span className="term-prompt">$</span> cat role.txt
                </p>
                <p className="term-role text-accent">
                  <span id="hero-role" className="hero-morph">
                    {personalInfo.title}
                  </span>
                </p>

                <p className="term-cmd" aria-hidden="true">
                  <span className="term-prompt">$</span> cat about.md
                </p>
                <p className="max-w-[56ch] text-lede text-ink text-pretty">
                  {personalInfo.headline}
                </p>

                <p className="term-cmd" aria-hidden="true">
                  <span className="term-prompt">$</span> ls ./actions
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ButtonLink href="#contact" variant="primary" size="lg">
                    ./get-in-touch
                  </ButtonLink>
                  <TrackedCvLink
                    href={personalInfo.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="lg"
                    icon={<Download className="h-4 w-4" aria-hidden="true" />}
                  >
                    cv.pdf
                  </TrackedCvLink>
                  <SmoothHashLink
                    href="#graph"
                    className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-chip px-1 text-small font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
                  >
                    open graph.tsx
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </SmoothHashLink>
                </div>

                <p className="term-cmd term-idle" aria-hidden="true">
                  <span className="term-prompt">$</span>
                  <span className="term-cursor" />
                </p>
              </div>
            </div>

            <div className="md:col-span-5 lg:col-span-4">
              <ProfileAvatar />
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <ExperienceSection />
      <RelationshipGraphSection />
      <ProjectsSection />
      <ContactSection />
    </div>
  );
}
