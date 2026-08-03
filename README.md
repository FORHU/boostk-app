# Welcome to BOOSTK

Boostk is a dual-purpose platform combining a real-time agent-customer chat support system with a global business services hub. It is designed to connect Korean and Japanese SMEs with English-speaking professionals in the Philippines to bridge global market entry barriers.

This application is built with a modern, high-performance stack:
* **Frontend/SSR:** TanStack Start (Full-stack React)
* **Runtime & Package Manager:** Bun
* **Database:** PostgreSQL with Prisma ORM
* **Real-Time Websockets:** Standalone Hono server running Socket.io

## 🛠 Prerequisites
Before setting up the project, make sure you have the following installed on your machine:

1. **Bun (v1.1+):** Our mandatory runtime and package manager. (Do not use npm, yarn, or pnpm). 
   * *Windows Installation (PowerShell as Admin):* `powershell -c "irm bun.sh/install.ps1 | iex"`
   * Note: Restart your terminal after installation to ensure the bun command is recognized. You can verify the installation by running: bun -v

2. **Docker Desktop:** Required to run our local PostgreSQL database container easily.

3. **Git:** For version control and cloning the repository.

### Getting Started

# Frontend & Core
Navigate to the root directory and install the required dependencies:
bun install

### Creating Local database
Create a file name: Dockerfile

1. # Use the official Bun image instead of Node
FROM oven/bun:alpine

2. # Goes to the app directory
WORKDIR /app

3. # Copy the package.json (and lock file if you have one)
COPY package.json bun.lockb* ./

4. # Install dependencies 
RUN bun install

5. # Copy everything else in the file (respecting .dockerignore)
COPY . .

6. # Set port env variable (Removed spaces around the '=' to fix the warning)
ENV PORT=3030

7. # Start the app (Use CMD instead of RUN) Replace "start" with whatever your actual script is in package.json (e.g., "dev" or "index.ts")
CMD ["bun", "run", "start"]

### Create a dockerignore
Create a file name: .dockerignore

1. # put inside the .dockerignore file
node_modules
.DS_Store
dist
dist-ssr
*.local
.env
.nitro
.tanstack
.wrangler
.output
.vinxi
__unconfig*
todos.json
prisma/generated

### Create compose file
Create a file name: compose.yaml / docker-compose.yaml

# content inside of a compose file
1. # Define the list of services to be managed
services:

2. # Name of the database service
local-db: 

3. # Use the official PostgreSQL image from Docker Hub
image: postgres:latest

4. # Map the container's ports to your host machine and Map host port 5432 to container port 5432
ports:
   - "5432:5432"

5. # Set variables for database initialization
environment:

6. # Set the default username
POSTGRES_USER: user

7. # Set the password for the database user
POSTGRES_PASSWORD: password123

8. # Set the initial database name
POSTGRES_DB: my_data

9.  # Define where to store database data persistently
volumes:
   - boostk_local:/var/lib/postgresql/data

10. # Define named volumes for shared data storage
volumes:
 boostk_local:
11. # Docker Setup Buil
docker build -t (name) .
### compose snippet code
services:
  local-db:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: my_data
    volumes:
      - boostk_local:/var/lib/postgresql/data
volumes:
 boostk_local:



# Database Configuration
Create a .env file in the root directory (boostk-app/) and populate it with the following configuration (replace the DATABASE_URL with your own from Postgresql, and update the API keys):

VITE_SOCKET_URL=http://localhost:3001

DATABASE_URL=postgresql://postgres.[YOUR_USERNAME] [YOUR_PASSWORD]@localhost:5432/[YOUR_DATABASE_NAME]

BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000/

RABBITMQ_URL=amqp://[user]:[password]@[ip]:5672

FORHU_CHAT_URL=https://chat-dev.forhu.ai

SUPPORT_LANGUAGE=en

# Initialize Database
For first-time implementation, initialize the Prisma client, run migrations, and seed the database using the consolidated script:
bun run setup-local-db

# ⚠️ CAUTION
Running this command includes prisma migrate reset which will completely reset your database and erase all existing data. Only use this for initial setup or when you explicitly need a clean state.

# Alternative Manual Database Setup (Optional)
If you prefer to run the steps individually or need more control:

1. Generate Prisma Client:
bun prisma generate

2. Reset/Apply Migrations: (Note: This will erase existing data):
bun prisma migrate reset

3. Seed the Database:
bun prisma db seed

# Running the Project
Run the development server from your terminal in the boostk-app root directory:
bun run dev


# Seed Account
| Role   | Email                            |
|        |                                  |
| Admin  | forhu-admin@example.com          |
| Admin  | organization1-admin@example.com  |
| Agent  | forhu-agent@example.com          |
| Agent  | organization1-agent@example.com  |
| Agent  | organization1-user1@example.com  |
| Member | organization1-user2@example.com  |
| Member | organization1-user3@example.com  |
| Member | forhu-user1@example.com          |
| Member | forhu-user2@example.com          |
| Member | forhu-user3@example.com          |
