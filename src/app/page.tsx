import React from "react";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { RelationshipGraphSection } from "@/components/RelationshipGraphSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ContactSection } from "@/components/ContactSection";

/**
 * Education and Skills are deliberately not on the page: the degrees and the
 * gold medal are told in About, and the full stack and grades live in the CV.
 * Their components and data are kept in case they come back.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <RelationshipGraphSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
}
