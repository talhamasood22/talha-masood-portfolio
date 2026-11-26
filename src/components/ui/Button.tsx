import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Shared button skin. Exported so a link that has to look like a button can
 * reuse it instead of nesting a <button> inside an <a> — which would be
 * invalid markup and would break Cmd/Ctrl-click and middle-click.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  const baseStyles =
    "group font-ui inline-flex items-center justify-center font-medium rounded-chip cursor-pointer select-none min-h-[44px] transition-colors duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:opacity-50";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-on-accent hover:bg-accent-soft font-semibold",
    outline:
      "border border-field-border text-ink hover:border-accent hover:text-accent",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "text-xs px-3.5 py-2 gap-2",
    md: "text-sm px-5 py-2.5 gap-2.5",
    lg: "text-[1rem] px-6 py-3 gap-2.5",
  };

  return cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

/**
 * Button. Squared-off rather than fully rounded so it belongs to the same
 * visual family as the panels; the only motion is the icon easing forward on
 * hover, which answers the pointer instead of decorating the page.
 */
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      <span>{children}</span>
      {icon && (
        <span
          aria-hidden="true"
          className="flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
        >
          {icon}
        </span>
      )}
    </button>
  );
}
