/**
 * src/data/portfolio.ts
 * Single source of truth for portfolio content. Every fact here traces back to
 * Talha's resume (public/Talha_Masood_Resume.pdf) or an earlier version of it.
 */

// ============================================================================
// 1. TYPE DEFINITIONS & SCHEMAS
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  id: string;
}

export interface MacroMetric {
  id: string;
  value: string;
  label: string;
  context: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  /** The hero lede under the name. */
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  availability: string;
  /** Where he is based and where he would work: the second thing a
   *  recruiter screens on after the start date. */
  workLocation: string;
  resumeUrl: string;
  metrics: MacroMetric[];
}

export interface AboutPillar {
  title: string;
  description: string;
}

export interface AboutInfo {
  narrative: string[];
  pillars: AboutPillar[];
}

/** A company or university mark, served from public/logos. */
export interface OrgLogo {
  src: string;
  /** The image has its own background and should fill the tile edge to edge. */
  bleed?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  logo?: OrgLogo;
  role: string;
  location: string;
  period: string;
  employmentType: string;
  /** The role told as a short story, first person, one paragraph per entry. */
  story: string[];
  /** An optional pointer to something on the page you can try. */
  link?: { href: string; label: string };
  /** Optional links off the site, such as app-store listings. */
  externalLinks?: { href: string; label: string }[];
  /** A handful of tags, not an inventory. The CV has the full list. */
  techStack: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  /** Why it exists and what it does, in prose. */
  summary: string;
  /** What I personally did, shown on its own line under the summary. */
  role?: string;
  metrics?: string;
  techStack: string[];
  isFeatured: boolean;
  architecture?: string[];
  demoUrl?: string;
  githubUrl?: string;
  /** No public code: say so, so "where's the repo?" has an answer. */
  codePrivate?: boolean;
}

export interface CourseModule {
  name: string;
  grade: string;
  highlight: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  logo?: OrgLogo;
  degree: string;
  location: string;
  period: string;
  gradeInfo: string;
  keyModules?: CourseModule[];
  description: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

// ============================================================================
// 2. NAVIGATION
// ============================================================================

export const NAV_ITEMS: NavItem[] = [
  { label: "About", href: "#about", id: "about" },
  { label: "Experience", href: "#experience", id: "experience" },
  { label: "Graph", href: "#graph", id: "graph" },
  { label: "Projects", href: "#projects", id: "projects" },
  { label: "Contact", href: "#contact", id: "contact" },
];

// ============================================================================
// 3. HEADLINE NUMBERS & PERSONAL INFO
// ============================================================================

export const personalInfo: PersonalInfo = {
  name: "Talha Masood",
  title: "Full-stack engineer",
  headline:
    "Over four years building software: two and a half full-time on production web and mobile apps, then two part-time on research and test tooling alongside my M.Sc. Right now I'm a full-stack engineer at Proxima Fusion, working across frontend, backend and DevOps, and both using and building agentic workflows.",
  location: "Stuttgart, Germany",
  // Contact details live in .env.local (gitignored) so they never reach the repo.
  // See .env.example.
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  linkedin: "https://linkedin.com/in/talhamasood22",
  github: "https://github.com/talhamasood22",
  availability: "Working student while finishing my M.Sc. · full-time from October 2027",
  workLocation: "Based in Stuttgart · open to roles across Germany and remote",
  resumeUrl: "/Talha_Masood_Resume.pdf",
  /** Only used on the link-preview card (opengraph-image), not on the page. */
  metrics: [
    {
      id: "graph-complexity",
      value: "96%",
      label: "Fewer graph nodes",
      context: "1,388 → 52 nodes in Proxima Fusion's task-run graph",
    },
    {
      id: "test-throughput",
      value: "70%",
      label: "More tests per day",
      context: "25 → 44 runs on Mercedes-Benz antenna test benches",
    },
    {
      id: "review-time",
      value: "80%",
      label: "Less manual review",
      context: "Test-result dashboard for six antenna test engineers",
    },
  ],
};

// ============================================================================
// 4. ABOUT
// ============================================================================

export const aboutInfo: AboutInfo = {
  narrative: [
    "The work I enjoy most sits between people and their data: the internal tools that decide whether a scientist finds the failed run in ten seconds or ten minutes. Alongside work I'm finishing an M.Sc. in Computer Science at the University of Stuttgart; my bachelor's in Computer Engineering at FAST-NUCES ended with the gold medal.",
    "I like owning a feature from end to end: the data model, the API, the interface, the tests and the pipeline that ships it. Before moving to Germany I spent two and a half years in Lahore building a real-estate platform for agents in the UAE; since then I've worked on antenna testing at Mercedes-Benz and full-stack engineering at Proxima Fusion.",
  ],
  pillars: [
    {
      title: "Making dense data readable",
      description: "Graphs, explorers and dashboards that surface the one thing that matters.",
    },
    {
      title: "Shipping without ceremony",
      description: "A preview on every pull request, so people try a change before it lands.",
    },
    {
      title: "Testing LLMs honestly",
      description: "Agent pipelines scored against ground truth, not eyeballed.",
    },
  ],
};

/** One-sentence ledes beside the section headings that have one. */
export const sectionLedes = {
  experience:
    "Three teams, and the parts of each job I'd most want you to know about. The full history is in my CV.",
  contact:
    "Hiring, building something interesting, or curious about anything on this page? Write to me; email reaches me fastest.",
};

// ============================================================================
// 5. EXPERIENCE
// ============================================================================

export const experiences: ExperienceItem[] = [
  {
    id: "proxima-fusion",
    company: "Proxima Fusion",
    logo: { src: "/logos/proxima-fusion.png" },
    role: "Software Engineer, Working Student",
    location: "Munich, Germany",
    period: "May 2026 – Present",
    employmentType: "Working student",
    story: [
      "I work across the whole stack: frontend, backend and DevOps, and I both use and build agentic workflows. Most of it goes into the internal tools Proxima's scientists use to run and keep track of their computations.",
      "The piece I'm proudest of is the task-run graph. Lineages had grown so dense they stopped being useful, so I designed an aggregation that groups runs by the object they act on, their direction and their task type, without merging lineages that are genuinely independent. On the worst production graph it cut 1,388 nodes to 52.",
      "I also made every pull request deploy its own staging-like environment in about five minutes. More than 40 scientists and the AI agents across the company use them: whoever opens the pull request shares the link with the people who asked for the change. And I built the explorer they use to find the failed, slow or uncommitted runs.",
    ],
    link: { href: "#graph", label: "Try the rebuilt graph" },
    techStack: ["TypeScript", "React Flow", "FastAPI", "Terraform", "Cloud Run"],
  },
  {
    id: "mercedes-benz",
    company: "Mercedes-Benz AG",
    logo: { src: "/logos/mercedes-benz.png", bleed: true },
    role: "Software Engineer, Working Student",
    location: "Sindelfingen, Germany",
    period: "Sep 2024 – Apr 2026",
    employmentType: "Working student",
    story: [
      "I joined the over-the-air antenna testing team, which measures how well a car's antennas perform.",
      "The test benches were the bottleneck, so I wrote a scheduler that runs tests concurrently on whichever benches are free: throughput went from about 25 tests a day to 44 (+70%).",
      "Then I built a dashboard for the results, which cut the time our six test engineers spent on manual review by 80%, and moved the services onto Docker and Jenkins so a deploy became repeatable and took about six minutes.",
    ],
    techStack: ["Node.js", "Vue.js", "Docker", "Jenkins"],
  },
  {
    id: "dubizzle-labs",
    company: "Dubizzle Labs",
    logo: { src: "/logos/dubizzle-labs.png" },
    role: "Full Stack Developer",
    location: "Lahore, Pakistan",
    period: "Oct 2021 – Apr 2024",
    employmentType: "Full-time",
    story: [
      "Two and a half years on Profolio, a mobile and web app for real-estate agents in the UAE, serving more than 100,000 users. I was one of three engineers building the new app, working with the project and product managers and directly with the product designers on design and UX decisions.",
      "I built TruLeads, which sorts leads by how agents have actually interacted with them and lifted agent conversion by 20%, and ProConnect, where about 10,000 agents share listings and coordinate deals over real-time chat. Reworking key mobile flows with the product team brought 15% more app downloads.",
    ],
    externalLinks: [
      { href: "https://apps.apple.com/pk/app/profolio/id1450925753", label: "App Store" },
      { href: "https://play.google.com/store/apps/details?id=com.bayut.bayutpro&hl=en_US", label: "Google Play" },
    ],
    techStack: ["React Native", "TypeScript", "Laravel", "Elasticsearch", "AWS"],
  },
];

// ============================================================================
// 6. PROJECTS
// ============================================================================

export const projects: ProjectItem[] = [
  {
    id: "multi-agent-cad",
    codePrivate: true,
    title: "Can small open source models write CAD?",
    category: "Applied LLMs",
    isFeatured: true,
    summary:
      "A three-person university project: can small open source models turn a sentence like \"a box 80 × 50 × 30 mm\" into a working 3D CAD model?",
    role: "I built the FastAPI backend and the Next.js frontend: type a request, see the part in 3D, download the files.",
    architecture: [
      "Understand: turns the request into a checklist of features and dimensions.",
      "Build: writes CAD code in Python (CadQuery) and runs it safely to produce 3D files.",
      "Check: compares the part with the checklist and asks for a fix, up to three tries.",
    ],
    techStack: ["Python", "vLLM", "CadQuery", "FastAPI", "Pydantic", "Next.js", "Three.js"],
  },
  {
    id: "body-posture-classifier",
    codePrivate: true,
    title: "Real-time body posture classifier",
    category: "Computer vision",
    isFeatured: false,
    summary:
      "Can an ordinary camera tell whether you're sitting, standing or lying down? This one can, 95% of the time: MediaPipe pulls 33 body landmarks from every frame and a k-nearest-neighbours classifier does the rest.",
    techStack: ["Python", "MediaPipe", "scikit-learn", "OpenCV"],
  },
  {
    id: "precision-agriculture",
    codePrivate: true,
    title: "Vertical farming system",
    category: "IoT and ML",
    isFeatured: false,
    summary:
      "An indoor growing rack you run from your phone. The Flutter app switches and schedules water, light and air, and a small TensorFlow model suggests which crop to plant for the current conditions.",
    techStack: ["Flutter", "Django", "TensorFlow"],
  },
];

// ============================================================================
// 7. EDUCATION
// ============================================================================

export const education: EducationItem[] = [
  {
    id: "uni-stuttgart",
    institution: "University of Stuttgart",
    logo: { src: "/logos/uni-stuttgart.png" },
    degree: "M.Sc. Computer Science",
    location: "Stuttgart, Germany",
    period: "Apr 2024 – Expected Oct 2027",
    gradeInfo: "84 ECTS completed",
    description:
      "Coursework in cloud computing, software architecture, computer vision, information retrieval and visual analytics, alongside working-student roles.",
    keyModules: [
      {
        name: "Service Management and Cloud Computing, and Evaluation",
        grade: "1.0",
        highlight: true,
      },
      {
        name: "Software Architecture - Course Project",
        grade: "1.0",
        highlight: true,
      },
      {
        name: "Advanced Seminar Computer Science",
        grade: "1.3",
        highlight: true,
      },
      {
        name: "Automotive and Assistive Computer Vision",
        grade: "1.6",
        highlight: false,
      },
      {
        name: "Information Retrieval and Text Mining",
        grade: "1.7",
        highlight: false,
      },
      {
        name: "Practical Course Information Systems",
        grade: "1.7",
        highlight: false,
      },
      {
        name: "Information Visualization and Visual Analytics",
        grade: "2.0",
        highlight: false,
      },
    ],
  },
  {
    id: "fast-nuces",
    institution: "National University of Computer and Emerging Sciences (FAST-NUCES)",
    logo: { src: "/logos/fast-nuces.png" },
    degree: "B.S. Computer Engineering",
    location: "Lahore, Pakistan",
    period: "Sep 2017 – Jul 2021",
    gradeInfo: "Gold medal · Dean's List, 6 semesters",
    description:
      "Graduated with the Gold Medal for academic excellence and six semesters on the Dean's List.",
  },
];

// ============================================================================
// 8. SKILLS (ordered by how much they carry the current resume)
// ============================================================================

export const skills: SkillCategory[] = [
  {
    id: "languages",
    category: "Languages",
    skills: ["TypeScript", "JavaScript", "Python", "SQL", "PHP"],
  },
  {
    id: "frontend-mobile",
    category: "Frontend and mobile",
    skills: [
      "React",
      "React Flow",
      "Next.js",
      "Vue.js",
      "React Native",
      "Expo",
      "TanStack Query",
      "Redux",
      "Pinia",
      "Three.js",
    ],
  },
  {
    id: "backend-databases",
    category: "Backend and data",
    skills: [
      "FastAPI",
      "Node.js",
      "SQLAlchemy",
      "Pydantic",
      "Laravel",
      "MySQL",
      "Elasticsearch",
      "Firebase",
    ],
  },
  {
    id: "cloud-devops",
    category: "Cloud and DevOps",
    skills: [
      "Docker",
      "GitHub Actions",
      "Terraform",
      "Google Cloud Run",
      "AWS (S3, EC2, RDS, DMS)",
      "Jenkins",
      "CircleCI",
      "Apptainer",
    ],
  },
  {
    id: "ai-llm-ml",
    category: "LLMs and ML",
    skills: [
      "Agent pipelines",
      "vLLM",
      "Prompt engineering",
      "CadQuery",
      "scikit-learn",
      "MediaPipe",
      "TensorFlow/Keras",
    ],
  },
  {
    id: "testing-tools",
    category: "Testing and tools",
    skills: [
      "Vitest",
      "React Testing Library",
      "Jest",
      "Git",
      "GitHub",
      "Graphite",
      "Bitbucket",
      "Postman",
      "Linux",
    ],
  },
];

// ============================================================================
// 9. CONTACT
// ============================================================================

export const contactForm = {
  title: "Write a message",
  intro: "Fill this in and it opens as a ready-to-send draft in your email app.",
};

/** Suggestions for the subject field; the visitor can still type anything. */
export const formSubjects: string[] = [
  "Full-stack engineering role",
  "Platform or developer tools role",
  "LLM / applied AI role",
  "Something else",
];

// ============================================================================
// 10. SITE COPY
// ============================================================================

export const siteCopy = {
  colophon: "Built with Next.js and Tailwind CSS.",
};
