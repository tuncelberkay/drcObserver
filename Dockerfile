# Stage 1: Base
FROM node:20-alpine AS base

# Install native dependencies for Prisma / SQLite and native module builds
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Stage 2: Dependencies and Build
FROM base AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies with npm install (more robust for cross-os builds than npm ci if package-lock is missing musl deps)
RUN npm install

COPY . .

# Generate Prisma Client explicitly for Alpine Linux architecture
RUN npx prisma generate

# Provide dummy build-time env vars to prevent SSG failures
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET="dummy-build-secret"
ENV NEXTAUTH_URL="http://localhost:3000"

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

# Include Prisma CLI for automated schema migrations against volume data
RUN npm install -g prisma@5.22.0
# Copy Prisma mapping for standalone runtime and give permissions to nextjs user
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Save a fresh copy of the schema OUTSIDE the volume so it isn't eclipsed by the named volume mount
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma /app/schema.prisma.fresh

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Standalone mode exposes server.js inherently. 
# We copy the fresh schema back into the volume to override any old trapped schema, then push.
CMD ["sh", "-c", "cp /app/schema.prisma.fresh /app/prisma/schema.prisma && npx prisma db push --accept-data-loss --skip-generate && node server.js"]
