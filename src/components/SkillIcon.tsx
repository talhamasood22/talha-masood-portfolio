import React from "react";
import {
  Box,
  Cloud,
  Database,
  MessageSquareText,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  siBitbucket,
  siCircleci,
  siDocker,
  siElasticsearch,
  siExpo,
  siFastapi,
  siFirebase,
  siGit,
  siGithub,
  siGithubactions,
  siGooglecloud,
  siGraphite,
  siJavascript,
  siJenkins,
  siJest,
  siLaravel,
  siLinux,
  siMediapipe,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPinia,
  siPostman,
  siPydantic,
  siPython,
  siReact,
  siReactquery,
  siRedux,
  siScikitlearn,
  siSqlalchemy,
  siTensorflow,
  siTerraform,
  siTestinglibrary,
  siThreedotjs,
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
 * restricted, and "SQL" or "Agent pipelines" are not products) get a
 * generic Lucide glyph instead. A name missing from both maps renders as
 * text only, so adding a skill never breaks the page.
 */
const BRAND_ICONS: Record<string, SimpleIcon | undefined> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Python: siPython,
  PHP: siPhp,
  React: siReact,
  "React Flow": siXyflow,
  "Next.js": siNextdotjs,
  "Vue.js": siVuedotjs,
  "React Native": siReact,
  Expo: siExpo,
  "TanStack Query": siReactquery,
  Redux: siRedux,
  Pinia: siPinia,
  "Three.js": siThreedotjs,
  FastAPI: siFastapi,
  "Node.js": siNodedotjs,
  SQLAlchemy: siSqlalchemy,
  Pydantic: siPydantic,
  Laravel: siLaravel,
  MySQL: siMysql,
  Elasticsearch: siElasticsearch,
  Firebase: siFirebase,
  Docker: siDocker,
  "GitHub Actions": siGithubactions,
  Terraform: siTerraform,
  "Google Cloud Run": siGooglecloud,
  Jenkins: siJenkins,
  CircleCI: siCircleci,
  vLLM: siVllm,
  "scikit-learn": siScikitlearn,
  MediaPipe: siMediapipe,
  "TensorFlow/Keras": siTensorflow,
  Vitest: siVitest,
  "React Testing Library": siTestinglibrary,
  Jest: siJest,
  Git: siGit,
  GitHub: siGithub,
  Graphite: siGraphite,
  Bitbucket: siBitbucket,
  Postman: siPostman,
  Linux: siLinux,
};

const GENERIC_ICONS: Record<string, LucideIcon> = {
  SQL: Database,
  "AWS (S3, EC2, RDS, DMS)": Cloud,
  Apptainer: Box,
  CadQuery: Box,
  "Agent pipelines": Workflow,
  "Prompt engineering": MessageSquareText,
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
