FROM oven/bun:1 AS base

# Install dependencies and build
FROM base AS build
WORKDIR /app
COPY package.json bun.lock .
RUN bun install --frozen-lockfile

COPY . .
# Generates Prisma client and runs vinxi build
ENV NODE_ENV=production
RUN bun run build

# Final runtime image
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Copy necessary files from the build stage for production
COPY --from=build /app/package.json ./
COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma ./prisma

# The TanStack Start Bun preset generates the entry file here
CMD ["bun", "run", ".output/server/index.mjs"]