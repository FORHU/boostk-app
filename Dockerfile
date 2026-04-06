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
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG VITE_SOCKET_URL
ARG OPENAI_API_KEY

# Convert ARGs to ENVs so 'bun run build' can validate them if needed
ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Generate Prisma client before build
RUN bun prisma generate

# Build the frontend payload (Nitro outputs to .output format)
RUN bun run build

# --- STAGE 2: Runtime ---
FROM oven/bun:1-slim AS release
WORKDIR /app

# Copy output, dependencies, and prisma from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production
EXPOSE 3000

# Run the frontend app via nitro server output
CMD ["bun", "run", ".output/server/index.mjs"]