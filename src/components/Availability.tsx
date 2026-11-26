import React from "react";
import { personalInfo } from "@/data/portfolio";
import { cn } from "@/lib/utils";

interface AvailabilityProps {
  as?: "p" | "figcaption";
  className?: string;
}

/**
 * Start date, then where he is based and open to work, with a status dot.
 * Shown in the hero, under the headline.
 */
export function Availability({ as: Tag = "p", className }: AvailabilityProps) {
  return (
    <Tag className={cn("flex items-start gap-2.5 text-small text-muted", className)}>
      <span
        aria-hidden="true"
        className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-status"
      />
      <span>
        {personalInfo.availability}{" "}
        <span className="block text-faint">{personalInfo.workLocation}</span>
      </span>
    </Tag>
  );
}
