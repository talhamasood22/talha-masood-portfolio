"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies the address and says so to screen readers through its own status. */
export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable: the mailto link beside it still works.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy email address"
        className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-chip border border-hairline text-faint transition-colors hover:border-hairline-strong hover:text-ink"
      >
        {copied ? (
          <Check className="h-4 w-4 text-status" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </>
  );
}
