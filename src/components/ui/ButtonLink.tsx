import React from "react";
import { buttonClassName } from "@/components/ui/Button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

/**
 * A navigation action that looks like a button. Rendered as a real anchor so
 * the browser's own link behaviour — new tab, copy link, Cmd/Ctrl-click —
 * keeps working.
 */
export function ButtonLink({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName({ variant, size, className })} {...props}>
      <span>{children}</span>
      {icon && (
        <span
          aria-hidden="true"
          className="flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
        >
          {icon}
        </span>
      )}
    </a>
  );
}
