import React from "react";
import { personalInfo } from "@/data/portfolio";
import { cn } from "@/lib/utils";

interface AvailabilityProps {
  as?: "p" | "figcaption";
  className?: string;
}

/** The availability line with its status dot (hero portrait and contact). */
export function Availability({ as: Tag = "p", className }: AvailabilityProps) {
  return (
    <Tag className={cn("flex items-start gap-2.5 text-small text-muted", className)}>
      <span
        aria-hidden="true"
        className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-status"
      />
      <span>{personalInfo.availability}</span>
    </Tag>
  );
}
