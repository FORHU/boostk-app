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

# Creating Local database


# Database Configuration
Create a .env file in the root directory (boostk-app/) and populate it with the following configuration (replace the DATABASE_URL with your own from Supabase, and update the API keys):

VITE_SOCKET_URL=http://localhost:3001
DATABASE_URL=postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-1-[REGION][.pooler.supabase.com:5432/postgres](https://.pooler.supabase.com:5432/postgres)
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000/
RABBITMQ_URL=amqp://[user]:[password]@[ip]:5672
OPENAI_API_KEY= openai-api-key-here

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


