# Stage 1: Base Alpine Image with libc6-compat for Next.js binary compatibility
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies based on package-lock.json
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 3: Build Next.js standalone application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Canonical origin baked into metadata, Open Graph tags and sitemap.xml.
# Pass the deployed Cloud Run URL or custom domain:
#   docker build --build-arg NEXT_PUBLIC_SITE_URL=https://example.com .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 4: Production runner image (<150MB footprint)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create non-root system group and user (UID 1001, GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to unprivileged user
USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
