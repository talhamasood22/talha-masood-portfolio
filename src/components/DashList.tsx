import React from "react";

interface DashListProps {
  items: string[];
  className?: string;
}

/** A bulleted list whose markers are short accent dashes. */
export function DashList({ items, className }: DashListProps) {
  if (items.length === 0) return null;

  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={i} className="relative pl-5 text-small text-muted text-pretty">
          <span
            aria-hidden="true"
            className="absolute left-0 top-[0.7em] h-px w-2.5 bg-accent"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
