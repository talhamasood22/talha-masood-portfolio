import React from "react";
import Image from "next/image";
import type { OrgLogo as OrgLogoData } from "@/data/portfolio";
import { cn } from "@/lib/utils";

/**
 * A company or university mark on a small white tile. The tile stays white in
 * dark mode too, so logos drawn for a light background keep their contrast.
 * Decorative: the name is always printed beside it.
 */
export function OrgLogo({
  logo,
  size = 40,
  className,
}: {
  logo: OrgLogoData;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "org-logo inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-white",
        !logo.bleed && "p-1.5",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={logo.src}
        alt=""
        width={size * 2}
        height={size * 2}
        className={cn("h-full w-full", logo.bleed ? "object-cover" : "object-contain")}
      />
    </span>
  );
}
