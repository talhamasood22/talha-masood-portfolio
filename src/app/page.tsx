import React from "react";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { RelationshipGraphSection } from "@/components/RelationshipGraphSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { SkillsSection } from "@/components/SkillsSection";
import { ContactSection } from "@/components/ContactSection";

/**
 * Education is deliberately not on the page: the degrees and the gold medal
 * are told in About, and the grades live in the CV. Its component and data
 * are kept in case it comes back.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <RelationshipGraphSection />
      <ProjectsSection />
      <SkillsSection />
      <ContactSection />
    </>
  );
}
