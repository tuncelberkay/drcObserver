# Stage 1: Base
FROM node:20-alpine AS base

# Install native dependencies for Prisma / SQLite
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Dependencies and Build
FROM base AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies (since it's an airgap target, this MUST run on a connected CI runner to build the artifact image)
RUN npm ci

COPY . .

# Generate Prisma Client explicitly for Alpine Linux architecture
RUN npx prisma generate

# Build Next.js in Standalone Mode
RUN npm run build

# Stage 3: Production Runtime Env
FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets
COPY --from=builder /app/public ./public
# Copy Prisma mapping for standalone runtime
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Standalone mode exposes server.js inherently
CMD ["node", "server.js"]
