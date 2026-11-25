"use client";

import { track } from "@vercel/analytics";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { ButtonLinkProps } from "@/components/ui/ButtonLink";

/**
 * The CV call to action. The anchor stays a real link, so the browser's own
 * download behaviour is untouched; the click is only counted on the way out.
 */
export function TrackedCvLink({ children, onClick, ...props }: ButtonLinkProps) {
  return (
    <ButtonLink
      {...props}
      onClick={(event) => {
        track("CV Download", { placement: "hero" });
        onClick?.(event);
      }}
    >
      {children}
    </ButtonLink>
  );
}
