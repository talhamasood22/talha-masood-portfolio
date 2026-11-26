"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formSubjects, personalInfo } from "@/data/portfolio";

const EMPTY_FORM = { name: "", company: "", subject: "", message: "" };
const MESSAGE_MAX = 2000;
const SUBJECTS_ID = "contact-subjects";

const fieldStyles =
  "w-full rounded-chip border border-field-border bg-page px-3.5 py-3 text-[1rem] text-ink placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40";

/**
 * Writes an email draft from the form and hands it to the visitor's mail app.
 * Nothing is transmitted from this page.
 */
export function ContactForm() {
  const [draftHref, setDraftHref] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [announcement, setAnnouncement] = useState("");
  const draftHeadingRef = useRef<HTMLHeadingElement>(null);

  // The form is replaced by the confirmation, so move focus to its heading
  // rather than leaving it on a button that no longer exists.
  useEffect(() => {
    if (draftHref) draftHeadingRef.current?.focus();
  }, [draftHref]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = [
      `Name: ${formData.name}`,
      formData.company ? `Organization: ${formData.company}` : null,
      "",
      formData.message,
    ]
      .filter((line) => line !== null)
      .join("\r\n");

    const mailto = `mailto:${personalInfo.email}?subject=${encodeURIComponent(
      formData.subject
    )}&body=${encodeURIComponent(body)}`;

    setDraftHref(mailto);
    setAnnouncement("Email draft prepared.");
    window.location.href = mailto;
  };

  const resetDraft = () => {
    setDraftHref(null);
    setFormData(EMPTY_FORM);
    setAnnouncement("Form cleared.");
  };

  return (
    <>
      {/* One live region that is always mounted, so announcements are read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {draftHref ? (
        <div className="mt-6 rounded-chip border border-accent/30 bg-accent/5 p-5">
          <Mail className="h-6 w-6 text-accent" aria-hidden="true" />
          <h4
            ref={draftHeadingRef}
            tabIndex={-1}
            className="mt-3 text-base font-semibold text-ink focus:outline-none"
          >
            Your email draft should open now
          </h4>
          <p className="mt-1.5 text-small text-muted">
            If your mail app did not open, use the button below, or write to{" "}
            <a
              href={`mailto:${personalInfo.email}`}
              className="focus-ring rounded text-accent underline underline-offset-2"
            >
              {personalInfo.email}
            </a>{" "}
            directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink
              href={draftHref}
              variant="primary"
              size="sm"
              icon={<Send className="h-4 w-4 text-on-accent" aria-hidden="true" />}
            >
              Open the draft again
            </ButtonLink>
            <Button variant="outline" size="sm" onClick={resetDraft}>
              Write another message
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-1.5 block text-small font-medium text-ink"
              >
                Full name *
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
                className={fieldStyles}
              />
            </div>
            <div>
              <label
                htmlFor="contact-company"
                className="mb-1.5 block text-small font-medium text-ink"
              >
                Organization
              </label>
              <input
                id="contact-company"
                name="organization"
                type="text"
                autoComplete="organization"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Organization name"
                className={fieldStyles}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-subject"
              className="mb-1.5 block text-small font-medium text-ink"
            >
              Subject *
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              required
              autoComplete="off"
              list={SUBJECTS_ID}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Role opportunity…"
              className={fieldStyles}
            />
            <datalist id={SUBJECTS_ID}>
              {formSubjects.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="mb-1.5 block text-small font-medium text-ink"
            >
              Message *
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              maxLength={MESSAGE_MAX}
              autoComplete="off"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Team, technical scope, and what you are hiring for…"
              className={fieldStyles}
            />
            <p className="meta mt-1.5">
              {formData.message.length} / {MESSAGE_MAX}
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            icon={<Send className="h-4 w-4 text-on-accent" aria-hidden="true" />}
          >
            Open email draft
          </Button>
        </form>
      )}
    </>
  );
}
