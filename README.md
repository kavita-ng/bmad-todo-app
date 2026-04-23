# bmad-todo-app

A full-stack task management SPA built as a reference implementation of the [BMad](https://github.com/bmad-ai/bmad-method) agile workflow. It lets Alex — a productivity-focused individual — create, view, update the status of, and delete todos in a clean, accessible interface. The project demonstrates end-to-end delivery: Vue 3 frontend, Fastify REST API, and SQLite persistence, all developed story-by-story through BMad's plan → design → implement → review cycle.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, TypeScript, Vite, Tailwind CSS v4, TanStack Vue Query v5, Pinia, Vue Router |
| Backend | Fastify v5, Drizzle ORM, libsql/SQLite, TypeScript, tsx |
| Testing | Vitest, @vue/test-utils |

## Prerequisites

- **Node.js** `^20.19.0 || >=22.12.0` (the project was developed on v22.19.0)
- **npm** ≥ 10 (bundled with Node 20+)

No other global tools are required.

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd bmad-todo-app

# 2. Install all workspace dependencies (frontend + backend)
npm install

# 3. Copy the backend environment file and review the values
cp backend/.env.example backend/.env
# Default values are correct for local development — no editing required:
#   DB_FILE_NAME=file:local.db       (SQLite database path, relative to backend/)
#   ALLOWED_ORIGIN=http://localhost:5173  (CORS — matches Vite dev server)

# 4. Run the database migration (creates the SQLite file and all tables)
npm run db:migrate --workspace=backend

# 5. Start both servers
npm run dev
# → Frontend (Vite):  http://localhost:5173
# → Backend (Fastify): http://localhost:3000
```

## Available Scripts

Run these from the **project root** unless otherwise noted.

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server and Fastify in watch mode concurrently |
| `npm run build` | Production build: type-check + Vite bundle (frontend) and `tsc` (backend) |
| `npm run test` | Run all Vitest suites in both workspaces concurrently |
| `npm run lint --workspace=frontend` | Run oxlint then ESLint on the frontend |
| `npm run db:generate --workspace=backend` | Regenerate SQL migrations after changing `backend/src/db/schema.ts` |
| `npm run db:migrate --workspace=backend` | Apply pending migrations to the local SQLite database |

## Project Structure

```
bmad-todo-app/
├── frontend/           # Vue 3 SPA
│   └── src/
│       ├── api/        # HTTP client and API functions
│       ├── components/ # Vue components + unit tests
│       ├── composables/# TanStack Vue Query composables (server state)
│       ├── router/     # Vue Router configuration
│       ├── stores/     # Pinia UI state stores
│       ├── types/      # Shared TypeScript types
│       └── views/      # Page-level view components
├── backend/            # Fastify REST API
│   └── src/
│       ├── db/         # Drizzle ORM schema and DB connection
│       ├── plugins/    # Fastify plugins (CORS, error handler)
│       ├── routes/     # Route handlers (todos)
│       └── types/      # Shared TypeScript types
├── _bmad-output/       # BMad planning and implementation artifacts (not app code)
│   ├── planning-artifacts/       # PRD, architecture design, epics
│   └── implementation-artifacts/ # Story files, sprint status
└── package.json        # Root npm workspace manifest
```

## Further Reading

- [Product Requirements Document](_bmad-output/planning-artifacts/prd.md)
- [Architecture Decision Record](_bmad-output/planning-artifacts/architecture.md)
