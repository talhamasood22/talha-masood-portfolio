import React from "react";
import { Mail, ArrowUp } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { personalInfo, siteCopy } from "@/data/portfolio";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const socialClass =
    "focus-ring flex h-11 w-11 items-center justify-center rounded-chip border border-hairline text-faint transition-colors hover:border-accent hover:text-accent";

  return (
    <footer className="border-t border-hairline" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[1.375rem] leading-none text-ink">
              {personalInfo.name}
            </p>
            <p className="mt-2 text-small text-muted">{personalInfo.title}</p>
            <p className="meta mt-1">{personalInfo.location}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={personalInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={socialClass}
              aria-label={`${personalInfo.name} on LinkedIn`}
            >
              <LinkedInIcon className="h-4 w-4" />
            </a>
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className={socialClass}
              aria-label={`${personalInfo.name} on GitHub`}
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${personalInfo.email}`}
              className={socialClass}
              aria-label={`Email ${personalInfo.name}`}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="meta mt-10 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p>
            © {currentYear} {personalInfo.name}. {siteCopy.colophon}
          </p>
          <a
            href="#main-content"
            className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-chip transition-colors hover:text-ink"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
