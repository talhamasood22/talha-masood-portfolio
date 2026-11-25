# Talha Masood — Software Engineer Portfolio

> Production-ready, responsive portfolio web application engineered with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS. Containerized via a multi-stage Alpine Dockerfile and architected for scalable, zero-downtime deployment on Google Cloud Run.

---

## Table of Contents
1. [Project Overview & Candidate Summary](#project-overview--candidate-summary)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Prerequisites & Requirements](#prerequisites--requirements)
4. [Quick Start & Local Development](#quick-start--local-development)
5. [Containerization with Docker](#containerization-with-docker)
6. [Google Cloud Run Deployment Guide](#google-cloud-run-deployment-guide)
7. [Custom Domain Mapping](#custom-domain-mapping)
8. [Profile Avatar Replacement Guide](#profile-avatar-replacement-guide)
9. [Troubleshooting & FAQ](#troubleshooting--faq)
10. [AAS Skills Compliance](#aas-skills-compliance)
11. [Contact Information](#contact-information)

---

## Project Overview & Candidate Summary

This application showcases the professional background, systems architecture expertise, and academic credentials of **Talha Masood**, a Full-Stack and Systems Software Engineer based in Stuttgart, Germany.

### Candidate Highlights
- **Role**: Full-Stack & Systems Software Engineer (4+ years experience)
- **Location**: Stuttgart, Germany
- **Work Experience**:
  - **Proxima Fusion** (Munich, Germany): Engineered React Flow + Dagre graph engine with isolated rendering; reduced graph complexity by **96%** (1,388 → 52 nodes) and edges by **97%**; developed FastAPI task explorer and authenticated STEP file upload workflows; automated PR previews via GitHub Actions, Terraform, and Cloud Run.
  - **Mercedes-Benz AG** (Sindelfingen, Germany): Developed internal vehicle antenna measurement dashboard in Vue.js, reducing review time by **80%**; engineered Node.js concurrency scheduler increasing test execution throughput by **70%** (25 → 44 tests/day); containerized pipelines via Jenkins.
  - **Dubizzle Labs** (Lahore, Pakistan): Scaled Profolio property management platform serving 100K+ users; increased agent lead conversion by **20%** via TruLeads™ (Elasticsearch); built real-time transaction chat (ProConnect) for 10K+ agents.
- **Featured Projects**:
  - **Multi-Agent LLM System for CAD-Model Creation**: Next.js, Three.js, FastAPI, CadQuery, vLLM, Docker/Apptainer; 3-agent pipeline (Reasoning, Generation, Feedback) with controlled ablation across Qwen2.5-Coder-7B, Llama-3.1-8B, and Gemma-2-9B evaluated against ground-truth STL Hausdorff distance.
  - **Real-Time Body Posture Classifier**: OpenCV, MediaPipe 33-landmark extraction, scikit-learn KNN (95% accuracy).
  - **Precision Home Agriculture IoT**: Mobile vertical farming solution with Flutter and Django ML recommendation engine (300% yield increase).
  - **Traffic Sign Classifier**: Convolutional Neural Network with TensorFlow/Keras.
- **Education**:
  - **University of Stuttgart**: M.Sc. Computer Science (84 ECTS; Grade 1.0 in Cloud Computing, Grade 1.0 in Software Architecture Course Project).
  - **FAST-NUCES**: B.S. Computer Engineering (**Gold Medal** for academic excellence, 6× Dean's List).

---

## Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components by default)
- **Runtime**: Node.js 20+ / Alpine Linux
- **Language**: TypeScript (strict mode enabled)
- **Design Tokens & Aesthetic**: Obsidian Dark Slate (`#090D16` / `#0F172A`) palette with Electric Cyan (`#38BDF8`) accents, precision typography (Geist / Inter), and double-bezel concentric squircle ("Doppelrand") cards with specular ambient back-glow.
- **Accessibility**: WCAG 2.2 AA / AAA compliance (>15:1 text contrast ratio, minimum 44×44px touch targets, visible keyboard focus rings, skip-to-content bypass, full ARIA coverage).
- **Containerization**: Multi-stage Dockerfile (`base`, `deps`, `builder`, `runner`) with Next.js `output: 'standalone'` resulting in an ultra-lightweight image (<150MB) executing as non-root user `nextjs` (UID 1001) on `PORT 8080`.
- **Infrastructure**: Google Cloud Run (fully managed serverless container runtime with scale-to-zero autoscaling).

---

## Prerequisites & Requirements

Before running the application locally or deploying to the cloud, ensure the following tooling is installed:

- **Node.js**: v20.x or v22.x LTS (`node -v`)
- **npm**: v10.x or higher (`npm -v`)
- **Docker Engine**: v24.x or higher / Docker Desktop (`docker -v`)
- **Google Cloud SDK (`gcloud`)**: Latest CLI (`gcloud --version`) with authenticated account access
- **Git**: For version control (`git --version`)

---

## Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/talhamasood22/talha_masood_portfolio.git
cd talha_masood_portfolio
npm install
```

### Private files (not in the repo)
Contact details and personal files are kept out of git:
- Copy `.env.example` to `.env.local` and fill in your email and phone.
- Add `public/Talha_Masood_Resume.pdf` and `public/images/profile.jpg` yourself.

Cloud Build still uploads these from your machine (see `.gcloudignore`), so deploys include them.

### 2. Start Offline Local Development Server
Launch the local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application supports offline local development with fast refresh.

### 3. Build & Verify Standalone Production Bundle
Test the Next.js standalone production build:
```bash
npm run build
```
This produces `.next/standalone/server.js`, verifying zero TypeScript, linting, or packaging errors.

### 4. Run Comprehensive E2E Verification Suite
Run the pure Node.js opaque-box E2E validation matrix (170 assertions across Tiers 1–4):
```bash
npm run test:e2e
# or directly with Node:
node tests/e2e/runner.js
```

---

## Containerization with Docker

The application includes an enterprise multi-stage `Dockerfile` based on `node:20-alpine` with four isolated stages:
1. `base`: Configures Alpine Linux with `libc6-compat`.
2. `deps`: Executes clean deterministic dependency installation via `npm ci`.
3. `builder`: Compiles Next.js standalone server bundles and pre-renders static assets.
4. `runner`: Sets up unprivileged group `nodejs` (GID 1001) and user `nextjs` (UID 1001), copies `.next/standalone` and `public/`, configures `PORT=8080`, and executes `node server.js`.

### 1. Build Container Image Locally
```bash
docker build -t talha-masood-portfolio:latest .
```

### 2. Run Container Locally on Port 8080
Run the container, forwarding port 8080:
```bash
docker run -d -p 8080:8080 -e PORT=8080 --name talha-portfolio talha-masood-portfolio:latest
```

### 3. Verify Container Healthcheck Probe
Verify that the standalone server is responding over HTTP:
```bash
curl -f http://localhost:8080/ || exit 1
```
Open [http://localhost:8080](http://localhost:8080) to inspect the containerized portfolio.

### 4. Teardown Local Container
```bash
docker stop talha-portfolio && docker rm talha-portfolio
```

---

## Google Cloud Run Deployment Guide

Google Cloud Run provides a serverless, horizontally autoscaling environment that runs stateless containers directly.

### Step 1: Authenticate and Configure GCP Project
```bash
# Log in to Google Cloud account
gcloud auth login

# Set your active GCP project ID
export PROJECT_ID="your-google-cloud-project-id"
gcloud config set project "${PROJECT_ID}"
```

### Step 2: Automated Deployment via Shell Script
Execute the provided automated deployment script:
```bash
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```
This script automatically:
1. Validates that `gcloud` is installed and `PROJECT_ID` is set.
2. Enables necessary APIs (`run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`).
3. Creates the Artifact Registry repository (`talha-portfolio-repo`) if it doesn't already exist.
4. Builds and pushes the container image via Google Cloud Build (`europe-west3-docker.pkg.dev/...`).
5. Executes `gcloud run deploy` with production parameters:
   - `--platform managed`
   - `--region europe-west3`
   - `--allow-unauthenticated`
   - `--port 8080`
   - `--memory 512Mi`
   - `--cpu 1`
   - `--min-instances 0` (scale-to-zero for cost efficiency)
   - `--max-instances 5`
   - `--concurrency 80`
6. Prints the live HTTPS URL.

### Step 3: Manual Deployment via `gcloud` CLI
If you prefer running individual commands:
```bash
# 1. Enable services
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 2. Build and push image
gcloud builds submit --tag europe-west3-docker.pkg.dev/${PROJECT_ID}/talha-portfolio-repo/talha-masood-portfolio:latest .

# 3. Deploy to Cloud Run
gcloud run deploy talha-masood-portfolio \
  --image europe-west3-docker.pkg.dev/${PROJECT_ID}/talha-portfolio-repo/talha-masood-portfolio:latest \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80
```

### Step 4: Automated CI/CD Pipeline via Cloud Build
Deploy continuously using the included `cloudbuild.yaml`:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## Custom Domain Mapping

To point your custom domain (e.g., `portfolio.yourdomain.com`) to your Google Cloud Run service:

```bash
gcloud beta run domain-mappings create \
  --service=talha-masood-portfolio \
  --domain=portfolio.yourdomain.com \
  --region=europe-west3
```
After running this command, Google Cloud Run displays the required DNS records (typically a `CNAME` pointing to `ghs.googlehosted.com`). Add this record to your DNS provider. Google automatically provisions and renews managed SSL/TLS certificates.

---

## Profile Avatar Replacement Guide

The portfolio features a dedicated, concentric squircle Doppelrand avatar component in the Hero section (`src/components/ProfileAvatar.tsx`).

### How to Replace the Avatar Photo
1. **Prepare Your Photo**: Select a high-resolution square or portrait photo (JPEG, PNG, or WebP format).
2. **Place in Public Directory**: Copy the file into `/public/avatar.jpg` (or `/public/avatar.png`):
   ```bash
   cp /path/to/your/photo.jpg public/avatar.jpg
   ```
3. **Configure Component**:
   In `src/components/ProfileAvatar.tsx`, update line 27:
   ```typescript
   const DEFAULT_PHOTO: string | null = "/avatar.jpg";
   ```
   Or pass `imageSrc="/avatar.jpg"` directly to `<ProfileAvatar imageSrc="/avatar.jpg" />` in `src/components/HeroSection.tsx`.
4. **Visual Result**:
   The component seamlessly switches from displaying the technical monogram ("TM") to rendering your headshot photo with Next.js image optimization, preserving the outer squircle glass bezel, ambient electric cyan back-glow, and engineering status badge.

---

## Troubleshooting & FAQ

### Q1: `Error: PROJECT_ID unset` or authentication failure
**Fix**: Ensure you have authenticated with GCP and configured an active project:
```bash
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
```

### Q2: Container fails to start or binds to the wrong port
**Fix**: Google Cloud Run injects the `PORT` environment variable (`8080`). The multi-stage `Dockerfile` sets `ENV PORT=8080` and `ENV HOSTNAME="0.0.0.0"`. If testing locally, always pass `-p 8080:8080 -e PORT=8080`.

### Q3: Cold start latency on scale-to-zero
**Fix**: By default, `--min-instances 0` scales down during periods of inactivity to avoid compute charges. For zero-latency cold starts, configure warm standby:
```bash
gcloud run services update talha-masood-portfolio --min-instances 1 --region europe-west3
```

### Q4: Artifact Registry permission denied (`403 FORBIDDEN`)
**Fix**: Ensure your GCP user or service account has the necessary IAM roles:
- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.admin`
- `roles/cloudbuild.builds.editor`

---

## AAS Skills Compliance

This portfolio was designed and implemented adhering strictly to the installed **Antigravity Agent Skills (AAS)**:

| AAS Skill | Applied Architecture & Implementation |
|-----------|---------------------------------------|
| `high-end-visual-design` | Doppelrand double-bezel concentric squircle glass cards with specular inset lighting, ambient cyan glow (`#38BDF8`), and obsidian background (`#090D16`). |
| `frontend-design` | Modern typographic hierarchy with Geist/Inter, calibrated tabular numbers for metrics, and floating island header navigation with scroll spy. |
| `ui-ux-pro-max` | Comprehensive responsive breakpoints (375px mobile, 768px tablet, 1280px+ desktop), bento grid projects showcase, and mobile navigation drawer. |
| `ui-a11y` | Full WCAG 2.2 AA / AAA compliance (>15:1 contrast, 44×44px touch targets, visible focus rings, skip-to-content bypass, ARIA landmarks). |
| `react-best-practices` | Server Components by default for static sections (arrays hoisted outside render); Client Components isolated to interactive islands. |
| `nextjs-best-practices` | Next.js 15 App Router conventions, `output: 'standalone'` build optimization, and unoptimized static image routing. |
| `tailwind-patterns` | Semantic theme tokens, CSS variable mapping, and zero arbitrary unconstrained utility values. |
| `bash-linux` | POSIX/Bash strict mode (`set -euo pipefail`), robust error traps, defensive parameter expansion, and toolchain checks in `deploy-cloudrun.sh`. |
| `deployment-procedures` | Pre-flight validation, automated API provisioning, immutable container image tagging, and post-deployment URL verification. |

---

## Contact Information

- **Talha Masood** — Full-Stack & Systems Software Engineer
- **LinkedIn**: [linkedin.com/in/talhamasood22](https://linkedin.com/in/talhamasood22)
- **GitHub**: [github.com/talhamasood22](https://github.com/talhamasood22)
- **Resume**: Download via `/public/Talha_Masood_Resume.pdf` or through the live portfolio Hero section.
