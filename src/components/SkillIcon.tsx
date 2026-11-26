import React from "react";
import {
  Box,
  Cloud,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  siDocker,
  siElasticsearch,
  siFastapi,
  siGithubactions,
  siGooglecloud,
  siJenkins,
  siLaravel,
  siLinux,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPython,
  siReact,
  siReactquery,
  siRedux,
  siSqlalchemy,
  siTerraform,
  siTestinglibrary,
  siTypescript,
  siVitest,
  siVllm,
  siVuedotjs,
  siXyflow,
  type SimpleIcon,
} from "simple-icons";

/**
 * Skill name (as written in src/data/portfolio.ts) → its logo. Brand marks
 * come from Simple Icons; names with no mark there (AWS's is trademark-
 * restricted, and "Agent pipelines" is not a product) get a
 * generic Lucide glyph instead. A name missing from both maps renders as
 * text only, so adding a skill never breaks the page.
 */
const BRAND_ICONS: Record<string, SimpleIcon | undefined> = {
  TypeScript: siTypescript,
  Python: siPython,
  PHP: siPhp,
  React: siReact,
  "React Flow": siXyflow,
  "Next.js": siNextdotjs,
  "Vue.js": siVuedotjs,
  "React Native": siReact,
  "TanStack Query": siReactquery,
  Redux: siRedux,
  FastAPI: siFastapi,
  "Node.js": siNodedotjs,
  SQLAlchemy: siSqlalchemy,
  Laravel: siLaravel,
  MySQL: siMysql,
  Elasticsearch: siElasticsearch,
  Docker: siDocker,
  "GitHub Actions": siGithubactions,
  Terraform: siTerraform,
  "Google Cloud Run": siGooglecloud,
  Jenkins: siJenkins,
  vLLM: siVllm,
  Vitest: siVitest,
  "React Testing Library": siTestinglibrary,
  Linux: siLinux,
};

const GENERIC_ICONS: Record<string, LucideIcon> = {
  "AWS (S3, EC2, RDS, DMS)": Cloud,
  Apptainer: Box,
  "Agent pipelines": Workflow,
};

export function SkillIcon({ name, className }: { name: string; className?: string }) {
  const brand = BRAND_ICONS[name];
  if (brand) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <path d={brand.path} />
      </svg>
    );
  }
  const Generic = GENERIC_ICONS[name];
  return Generic ? (
    <Generic aria-hidden="true" strokeWidth={1.75} className={className} />
  ) : null;
}
