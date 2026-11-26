import type { Metadata, Viewport } from "next";
import { EB_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import { THEME_CHROME } from "@/lib/theme";
import { personalInfo } from "@/data/portfolio";
import { Analytics } from "@vercel/analytics/next";

/* Mockup: EB Garamond, a variable-weight old-style serif, for everything
   except the monospace accent. */
const serif = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["Garamond", "Georgia", "serif"],
});

/* A monospace accent for numbers and tech names only (badges, stats, chart
   values), so figures line up and stack names read as code. Everything else
   stays Archivo. */
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/**
 * Applies the saved theme before the first paint. Without this the page
 * renders dark for a frame and then flips for anyone who chose light. Once the
 * head is parsed it also points every theme-color meta at the chosen theme,
 * so the browser chrome matches a stored choice that differs from the OS.
 */
const themeScript = `(function(){var theme="dark";try{var stored=localStorage.getItem("theme");var light=window.matchMedia("(prefers-color-scheme: light)").matches;theme=stored==="light"||stored==="dark"?stored:(light?"light":"dark");}catch(e){}document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;})();`;

const pageTitle = `${personalInfo.name} | ${personalInfo.title}`;
const pageDescription = `${personalInfo.name}, based in ${personalInfo.location}. ${personalInfo.headline}`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: THEME_CHROME.dark },
    { media: "(prefers-color-scheme: light)", color: THEME_CHROME.light },
  ],
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: pageTitle,
  description: pageDescription,
  keywords: [
    personalInfo.name,
    "Full-Stack Software Engineer",
    "Next.js",
    "React",
    "TypeScript",
    "FastAPI",
    "Python",
    "Stuttgart",
    "Germany",
    "Proxima Fusion",
    "Mercedes-Benz",
    "LLM pipelines",
    "Graph Visualization",
    "React Flow",
    "Terraform",
  ],
  authors: [{ name: personalInfo.name, url: personalInfo.linkedin }],
  creator: personalInfo.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: pageTitle,
    description: personalInfo.headline,
    url: "/",
    siteName: personalInfo.name,
    type: "website",
    locale: "en_US",
  },
  // Title, description and image are filled in from openGraph.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-page text-ink antialiased">
        {/* Skip to Main Content Link for WCAG Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-accent focus:text-on-accent focus:font-semibold focus:rounded-chip focus:outline-none focus:z-[60]"
        >
          Skip to main content
        </a>

        {/* Navigation: a floating bar on small screens, a floating panel in
            the left gutter on large ones. The name docks into either. */}
        <SiteHeader />

        {/* On large screens the page leaves the left gutter to the floating
            navigation panel. */}
        <div className="lg:pl-56">
          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>

          <Footer />
        </div>

        <Analytics />
      </body>
    </html>
  );
}
