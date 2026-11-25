import React from "react";

interface SectionHeaderProps {
  headingId: string;
  title: string;
  lede?: string;
}

/**
 * One header for every section: a hairline, the heading set slightly wide,
 * and an optional one-sentence lede beside it on wide screens.
 */
export function SectionHeader({ headingId, title, lede }: SectionHeaderProps) {
  return (
    <div className="grid gap-3 border-t border-hairline pt-8 md:grid-cols-12 md:items-baseline md:gap-8">
      <h2
        id={headingId}
        className="font-heading text-h2 text-ink text-balance md:col-span-4"
      >
        {title}
      </h2>
      {lede && (
        <p className="max-w-[60ch] text-small text-muted text-pretty md:col-span-8">
          {lede}
        </p>
      )}
    </div>
  );
}
