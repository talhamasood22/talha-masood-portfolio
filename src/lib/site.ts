/**
 * Canonical site origin used for absolute URLs in metadata, Open Graph tags and
 * the sitemap. Set NEXT_PUBLIC_SITE_URL at build time (Cloud Run service URL or
 * custom domain); localhost is only a development fallback.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL;

if (!configured && process.env.NODE_ENV === "production") {
  // Not fatal: local production builds and the e2e suite run without it. A
  // deployed build without it would point canonical URLs at localhost.
  console.warn(
    "[site] NEXT_PUBLIC_SITE_URL is not set; canonical, Open Graph and sitemap URLs will use http://localhost:3000."
  );
}

export const SITE_URL = new URL(configured ?? "http://localhost:3000");
