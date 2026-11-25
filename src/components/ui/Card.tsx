import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  coreClassName?: string;
}

/**
 * Panel primitive: a hairline border on the panel surface, with a faint inset
 * highlight along the top edge. Flat, no lift or glow.
 */
export function Card({ children, className, coreClassName, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-panel border border-hairline bg-panel",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "relative h-full w-full p-6",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          coreClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
