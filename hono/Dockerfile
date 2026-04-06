FROM oven/bun:1-slim AS release
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies for the backend
RUN bun install --frozen-lockfile

# Copy the server source code
COPY . .

# Set production environment
ENV NODE_ENV=production
EXPOSE 3001

# Start the socket server directly with bun
CMD ["bun", "src/index.ts"]
