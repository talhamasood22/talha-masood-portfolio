#!/usr/bin/env bash
# ==============================================================================
# deploy-cloudrun.sh
# Production Google Cloud Run Deployment Script for Talha Masood's Portfolio
#
# Adheres strictly to enterprise SRE standards and project acceptance criteria:
# - Bash strict mode: set -euo pipefail
# - Configurable parameters with robust defaults
# - Pre-flight environment, tooling, and authentication validations
# - Required API enablement (run, artifactregistry, cloudbuild)
# - Artifact Registry repository setup and multi-tag push
# - Google Cloud Run deployment with hardened container flags:
#     --platform managed
#     --region europe-west3
#     --allow-unauthenticated
#     --port 8080
#     --memory 512Mi
#     --cpu 1
#     --min-instances 0
#     --max-instances 5
#     --concurrency 80
# ==============================================================================
set -euo pipefail

# --- Color formatting helpers ---
readonly BOLD='\033[1m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ------------------------------------------------------------------------------
# 1. Configuration & Parameter Defaults
# ------------------------------------------------------------------------------
# Canonical origin baked into metadata, Open Graph tags and sitemap.xml at
# build time. Set it to the Cloud Run service URL or your custom domain.
SITE_URL="${SITE_URL:-https://REPLACE-WITH-YOUR-DOMAIN}"
SERVICE_NAME="${SERVICE_NAME:-talha-masood-portfolio}"
REGION="${REGION:-europe-west3}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REPOSITORY="${REPOSITORY:-talha-portfolio-repo}"
PORT="8080"
MEMORY="512Mi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="5"
CONCURRENCY="80"

# ------------------------------------------------------------------------------
# 2. Pre-flight Validation: Toolchain & Project Checks
# ------------------------------------------------------------------------------
info "Checking required dependencies..."
if ! command -v gcloud &> /dev/null; then
  error "Google Cloud SDK ('gcloud') CLI is required but not installed or found in PATH."
  error "Please install gcloud from https://cloud.google.com/sdk/docs/install and authenticate."
  exit 1
fi
ok "Google Cloud SDK is installed: $(gcloud --version 2>&1 | head -n 1)"

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  error "PROJECT_ID is not set and could not be determined from gcloud configuration."
  error "Please specify a project ID by setting the PROJECT_ID environment variable or run:"
  error "  export PROJECT_ID=\"your-google-cloud-project-id\""
  error "  or: gcloud config set project your-google-cloud-project-id"
  exit 1
fi
ok "Target GCP Project ID: ${PROJECT_ID}"

if [[ "${SITE_URL}" == *REPLACE-WITH-YOUR-DOMAIN* ]]; then
  warn "SITE_URL is still the placeholder. Canonical and Open Graph URLs will be wrong."
  warn "  export SITE_URL=\"https://your-domain.example\" and re-run."
fi

echo -e "\n${BOLD}================================================================================${NC}"
echo -e "${BOLD}DEPLOYING TALHA MASOOD PORTFOLIO TO GOOGLE CLOUD RUN${NC}"
echo -e "================================================================================"
echo -e "  Site URL:        ${BOLD}${SITE_URL}${NC}"
echo -e "  Service Name:    ${BOLD}${SERVICE_NAME}${NC}"
echo -e "  GCP Project:     ${BOLD}${PROJECT_ID}${NC}"
echo -e "  Region:          ${BOLD}${REGION}${NC}"
echo -e "  Container Port:  ${BOLD}${PORT}${NC}"
echo -e "  Memory Limit:    ${BOLD}${MEMORY}${NC}"
echo -e "  CPU Allocation:  ${BOLD}${CPU}${NC}"
echo -e "  Min Instances:   ${BOLD}${MIN_INSTANCES}${NC} (Scale-to-zero enabled)"
echo -e "  Max Instances:   ${BOLD}${MAX_INSTANCES}${NC}"
echo -e "  Concurrency:     ${BOLD}${CONCURRENCY}${NC} requests/instance"
echo -e "================================================================================\n"

# ------------------------------------------------------------------------------
# 3. Enable Required Google Cloud Service APIs
# ------------------------------------------------------------------------------
info "Enabling required Google Cloud APIs (Cloud Run, Artifact Registry, Cloud Build)..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"
ok "Required Google Cloud APIs are active."

# ------------------------------------------------------------------------------
# 4. Artifact Registry Setup & Image Tag Definition
# ------------------------------------------------------------------------------
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:${IMAGE_TAG}"
GCR_FALLBACK="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"

info "Ensuring Artifact Registry repository '${REPOSITORY}' exists in ${REGION}..."
if ! gcloud artifacts repositories describe "${REPOSITORY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" &> /dev/null; then
  info "Repository '${REPOSITORY}' not found. Creating Docker repository..."
  gcloud artifacts repositories create "${REPOSITORY}" \
    --project="${PROJECT_ID}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for ${SERVICE_NAME}" || true
fi
ok "Artifact Registry repository is ready: ${IMAGE_URI}"

# ------------------------------------------------------------------------------
# 5. Build and Push Container Image via Google Cloud Build
# ------------------------------------------------------------------------------
# Build through cloudbuild.yaml so NEXT_PUBLIC_SITE_URL reaches the Docker
# build as a build arg; a plain `--tag` submit would skip it. The config also
# runs its own Cloud Run deploy step with the same flags as step 6.
info "Submitting build to Google Cloud Build (target: ${IMAGE_URI})..."
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --config=cloudbuild.yaml \
  --substitutions="_SERVICE_NAME=${SERVICE_NAME},_REGION=${REGION},_REPOSITORY=${REPOSITORY},_IMAGE_TAG=${IMAGE_TAG},_SITE_URL=${SITE_URL}" \
  .
ok "Container image built and pushed to Artifact Registry."

# ------------------------------------------------------------------------------
# 6. Deploy Container to Google Cloud Run
# ------------------------------------------------------------------------------
info "Deploying container service to Google Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --platform managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --project="${PROJECT_ID}"

# ------------------------------------------------------------------------------
# 7. Post-Deployment Verification & URL Display
# ------------------------------------------------------------------------------
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format='value(status.url)' 2>/dev/null || echo "")

echo -e "\n${BOLD}================================================================================${NC}"
echo -e "${GREEN}${BOLD}✓ DEPLOYMENT COMPLETE!${NC}"
echo -e "================================================================================"
if [[ -n "${SERVICE_URL}" ]]; then
  echo -e "  Live Service URL: ${BOLD}${SERVICE_URL}${NC}"
  echo -e "  Custom Domain Mapping command:"
  echo -e "    gcloud beta run domain-mappings create --service=${SERVICE_NAME} --domain=yourdomain.com --region=${REGION}"
else
  warn "Unable to retrieve service URL automatically. Verify in the GCP Cloud Run Console."
fi
echo -e "================================================================================\n"
