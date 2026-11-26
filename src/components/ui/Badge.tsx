import React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * Small chip for a skill name: panel surface, hairline border, muted text,
 * set in monospace so stack names read as code.
 */
export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-chip border border-hairline bg-panel px-2.5 py-1 font-mono text-[0.75rem] leading-snug text-muted",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
