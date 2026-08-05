# ---------- build stage ----------
# Compiles the app. None of this tooling ships in the final image.
FROM oven/bun:1-alpine AS build

# Prisma's schema engine (used by `prisma generate` and `prisma migrate`) is a
# native binary that links against OpenSSL. Alpine/musl does not ship it, so
# without this the engine download or exec fails.
RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

# Lockfile first, so Docker can cache the install layer across builds.
# NOTE: this project uses bun.lock (text format), NOT bun.lockb (binary).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# REQUIRED: prisma/generated/ is gitignored, so it does not exist on a fresh
# checkout. Every Prisma import breaks without this. (Same step as ci.yml.)
RUN bun prisma generate

# VITE_* values are INLINED into the client bundle by Vite during the build.
# They cannot be injected later with --env-file — by then the strings are
# already compiled in. deploy.yml passes these as --build-arg.
ARG VITE_SOCKET_URL
ARG VITE_SUPPORT_PROJECT_ID
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_SUPPORT_PROJECT_ID=$VITE_SUPPORT_PROJECT_ID

# Produces .output/ — the Nitro server bundle that `start` runs.
RUN bun run build

# ---------- runtime stage ----------
FROM oven/bun:1-alpine AS runtime

# Same OpenSSL requirement — this stage runs `prisma migrate deploy` on deploy.
RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

# .output          the built web app (Nitro, bun preset)
# src              socket-server runs straight from TypeScript — bun executes it
# prisma + config  needed to run `prisma migrate deploy` from this same image
# node_modules     carries the prisma CLI and the socket server's deps
COPY --from=build /app/.output          ./.output
COPY --from=build /app/src              ./src
COPY --from=build /app/prisma           ./prisma
COPY --from=build /app/node_modules     ./node_modules
COPY --from=build /app/package.json     ./package.json
COPY --from=build /app/tsconfig.json    ./tsconfig.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
ENV PORT=5000

# Document that the container serves on this port
EXPOSE 5000

# Default entrypoint is the web app. docker-compose.prod.yaml overrides
# `command` to run the socket relay and the migration job from this same
# image, so app / relay / schema are always the identical commit.
CMD ["bun", "run", ".output/server/index.mjs"]
