# 1. Use the official Bun image instead of Node
FROM oven/bun:alpine

# Goes to the app directory
WORKDIR /app

# Copy the package.json (and lock file if you have one)
COPY package.json bun.lockb* ./

# Install dependencies 
RUN bun install

# Copy everything else in the file (respecting .dockerignore)
COPY . .

# 2. Set port env variable (Removed spaces around the '=' to fix the warning)
ENV PORT=5000

# Document that the container serves on this port
EXPOSE 5000

# 3. Start the app (Use CMD instead of RUN)
# Replace "start" with whatever your actual script is in package.json (e.g., "dev" or "index.ts")
CMD ["bun", "run", "start"]