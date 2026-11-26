import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import { THEME_CHROME } from "@/lib/theme";
import { personalInfo } from "@/data/portfolio";
import { Analytics } from "@vercel/analytics/next";

/* Mockup: TeX Gyre Pagella X (Michael Sharpe's extension of TeX Gyre
   Pagella, from the newpx package on CTAN; GUST Font License), a Palatino
   design, self-hosted. It ships in regular and bold only. */
const serif = localFont({
  variable: "--font-serif",
  src: [
    { path: "./fonts/TeXGyrePagellaX-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/TeXGyrePagellaX-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/TeXGyrePagellaX-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/TeXGyrePagellaX-BoldItalic.otf", weight: "700", style: "italic" },
  ],
  display: "swap",
  fallback: ["Palatino", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
});

/* The relationship graph keeps Archivo, so the mockup only changes the
   page text around it. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
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
      className={`${serif.variable} ${archivo.variable} ${mono.variable}`}
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
