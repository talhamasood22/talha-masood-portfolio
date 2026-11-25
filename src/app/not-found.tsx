import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
      <p className="meta">404</p>
      <h1 className="mt-3 font-heading text-h2 text-ink">Page not found</h1>
      <p className="mt-4 max-w-[48ch] text-small text-muted">
        This address does not exist. The portfolio is a single page.
      </p>
      <p className="mt-8">
        <Link
          href="/"
          className="focus-ring inline-flex min-h-[44px] items-center rounded-chip bg-accent px-5 text-small font-semibold text-on-accent transition-colors hover:bg-accent-soft"
        >
          Back to the portfolio
        </Link>
      </p>
    </div>
  );
}
