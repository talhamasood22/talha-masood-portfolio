import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { ContactForm } from "@/components/ContactForm";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { contactForm, personalInfo, sectionLedes } from "@/data/portfolio";

/** "https://www.github.com/name/" → "github.com/name" */
const displayUrl = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const channels = [
  {
    key: "email",
    icon: <Mail className="h-4 w-4" />,
    label: "Email",
    value: personalInfo.email,
    href: `mailto:${personalInfo.email}`,
    external: false,
  },
  {
    key: "phone",
    icon: <Phone className="h-4 w-4" />,
    label: "Phone",
    value: personalInfo.phone,
    href: `tel:${personalInfo.phone.replace(/\s/g, "")}`,
    external: false,
  },
  {
    key: "location",
    icon: <MapPin className="h-4 w-4" />,
    label: "Location",
    value: personalInfo.location,
    href: null,
    external: false,
  },
  {
    key: "linkedin",
    icon: <LinkedInIcon className="h-4 w-4" />,
    label: "LinkedIn",
    value: displayUrl(personalInfo.linkedin),
    href: personalInfo.linkedin,
    external: true,
  },
  {
    key: "github",
    icon: <GitHubIcon className="h-4 w-4" />,
    label: "GitHub",
    value: displayUrl(personalInfo.github),
    href: personalInfo.github,
    external: true,
  },
];

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headingId="contact-heading"
          title="Contact"
          lede={sectionLedes.contact}
        />

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Direct channels */}
          <div className="lg:col-span-5">
            <dl className="border-t border-hairline">
              {channels.filter((channel) => channel.value).map((channel) => (
                <div
                  key={channel.key}
                  className="flex items-center justify-between gap-3 border-b border-hairline py-3"
                >
                  <dt className="flex shrink-0 items-center gap-2.5 text-faint">
                    <span aria-hidden="true">{channel.icon}</span>
                    <span className="text-small max-[359px]:sr-only">
                      {channel.label}
                    </span>
                  </dt>
                  <dd
                    className={
                      channel.key === "email"
                        ? "flex min-w-0 items-center justify-end gap-3"
                        : "min-w-0 text-right"
                    }
                  >
                    {channel.href ? (
                      <a
                        href={channel.href}
                        {...(channel.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="focus-ring inline-flex min-h-[44px] min-w-0 max-w-full items-center gap-1 rounded-chip text-small text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                      >
                        <span className="truncate">{channel.value}</span>
                        {channel.external && (
                          <span className="sr-only">(opens in a new tab)</span>
                        )}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-[44px] items-center text-small text-ink">
                        {channel.value}
                      </span>
                    )}
                    {channel.key === "email" && (
                      <CopyEmailButton email={personalInfo.email} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Message composer */}
          <div className="lg:col-span-7">
            <Card coreClassName="p-6 md:p-8">
              <h3 className="text-h3 font-semibold text-ink">{contactForm.title}</h3>
              <p className="mt-1.5 text-small text-muted">{contactForm.intro}</p>
              <ContactForm />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
