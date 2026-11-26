import React from "react";
import Image from "next/image";
import { personalInfo } from "@/data/portfolio";

/**
 * Portrait for the hero. Availability sits under the headline instead, so it
 * is on the first screen on phones too.
 *
 * To use a different photo, replace `public/images/profile.jpg` with a square
 * or portrait image (1200px or larger). The monogram behind the photo is only
 * seen while the photo is loading; it does not replace a missing file.
 */
export function ProfileAvatar() {
  const initials = personalInfo.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <figure className="mx-auto w-full max-w-[22rem] md:mr-0 lg:max-w-[20rem]">
      <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-square rounded-panel border border-hairline bg-panel">
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-4xl text-faint"
        >
          {initials}
        </span>
        <Image
          src="/images/profile.jpg"
          alt={`Portrait of ${personalInfo.name}`}
          width={900}
          height={900}
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1024px) 20rem, (min-width: 768px) 40vw, 90vw"
          className="relative h-full w-full object-cover"
        />
      </div>

    </figure>
  );
}
