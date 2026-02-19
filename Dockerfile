# --- STAGE 1: Build ---
FROM oven/bun:1 AS builder
WORKDIR /app

# Set NODE_ENV for the build process
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .

# Define ARGs (Passed from docker-compose or --build-arg)
ARG DATABASE_URL
ARG VITE_APP_ENV
ARG VITE_APP_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL

# Convert ARGs to ENVs so 'bun run build' can validate them via T3-Env
ENV DATABASE_URL=$DATABASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_URL=$VITE_APP_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL

# This will fail if any of the above are missing/invalid
RUN bun run build

# --- STAGE 2: Runtime ---
FROM oven/bun:1-slim AS release
WORKDIR /app

# Copy assets from builder
COPY --from=builder /app/dist/app ./dist/app
COPY --from=builder /app/dist/client ./dist/client
COPY --from=builder /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production
EXPOSE 3000

# Run the app
CMD ["./dist/app"]