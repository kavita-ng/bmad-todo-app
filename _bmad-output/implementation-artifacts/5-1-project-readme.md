# Story 5.1: Project README

Status: done

## Story

As a new developer joining the project,
I want a comprehensive README at the project root,
So that I can understand what the app does, get it running locally, and know where to find further documentation — all without asking anyone.

## Acceptance Criteria

1. **Given** a developer clones the repository for the first time
   **When** they read the README
   **Then** they understand the app's purpose, the user it is built for, and the core feature set within 2 minutes of reading

2. **Given** the README's Prerequisites section
   **When** a developer checks their environment
   **Then** the minimum Node.js version (≥ 20.19.0) and any other required tools are clearly stated

3. **Given** the README's Local Setup section
   **When** followed step by step from a fresh clone
   **Then** the developer has both the Vite dev server and Fastify server running locally with no undocumented steps required (clone → install → copy env → migrate → run)

4. **Given** the README's Available Scripts section
   **When** read by a developer
   **Then** all root-level scripts (`dev`, `build`, `test`) are listed with a one-line description of what each does

5. **Given** the README's Project Structure section
   **When** read by a developer
   **Then** the top-level directory layout (`frontend/`, `backend/`, `_bmad-output/`) is described with brief notes on each area's purpose

6. **Given** the README's Further Reading section
   **When** read by a developer
   **Then** links to `_bmad-output/planning-artifacts/prd.md` and `_bmad-output/planning-artifacts/architecture.md` are present and correct

## Tasks / Subtasks

- [x] Task 1: Replace the placeholder root README.md with a full, accurate README (AC: #1–#6)
  - [x] 1.1 Write the **Overview** section: one paragraph describing bmad-todo-app — a task management SPA with a Vue 3 frontend + Fastify REST API + SQLite backend; built as a reference implementation demonstrating the BMad workflow. Mention the primary user persona (Alex, a productivity-focused individual).
  - [x] 1.2 Write the **Tech Stack** section: list Vue 3, TypeScript, Vite, Tailwind CSS v4, TanStack Vue Query v5, Pinia, Vue Router (frontend); Fastify v5, Drizzle ORM, libsql/SQLite, TypeScript (backend); Vitest, @vue/test-utils (testing).
  - [x] 1.3 Write the **Prerequisites** section: Node.js `^20.19.0 || >=22.12.0` (project runs on v22.19.0 at time of writing). npm ≥ 10 (comes bundled with Node 20+). No other global tools required.
  - [x] 1.4 Write the **Local Setup** section with numbered steps: (1) clone, (2) `npm install` from root (installs all workspaces), (3) `cp backend/.env.example backend/.env` and review values (`DB_FILE_NAME=file:local.db`, `ALLOWED_ORIGIN=http://localhost:5173`), (4) run the DB migration `npm run db:migrate --workspace=backend`, (5) start both servers `npm run dev` from root. Note the URLs: frontend → `http://localhost:5173`, backend → `http://localhost:3000`.
  - [x] 1.5 Write the **Available Scripts** section: table or list of root-level scripts (`dev` — start both Vite dev server and Fastify in watch mode concurrently; `build` — production build of frontend and backend; `test` — run all Vitest test suites in both workspaces). Also list key workspace scripts for reference: `npm run lint --workspace=frontend`, `npm run db:generate --workspace=backend`, `npm run db:migrate --workspace=backend`.
  - [x] 1.6 Write the **Project Structure** section: show top-level tree with brief descriptions for `frontend/` (Vue 3 SPA — source in `src/`), `backend/` (Fastify REST API — source in `src/`, migrations in `drizzle/`), `_bmad-output/` (BMad planning and implementation artifacts — not application code), `package.json` (root workspace manifest).
  - [x] 1.7 Write the **Further Reading** section: two markdown links — `_bmad-output/planning-artifacts/prd.md` (Product Requirements Document) and `_bmad-output/planning-artifacts/architecture.md` (Architecture Decision Record).
  - [x] 1.8 Verify the completed README is accurate: confirmed all sections present, all commands verified, all file paths confirmed to exist, all links point to existing files.

- [x] Task 2: Verify no regressions (AC: all)
  - [x] 2.1 Confirmed `README.md` exists at project root: 3,687 bytes, 85 lines.
  - [x] 2.2 Ran `npm run test` from root: 30/30 frontend + 29/29 backend = 59/59 tests pass.
  - [x] 2.3 Confirmed both linked files exist: `_bmad-output/planning-artifacts/prd.md` ✅ `_bmad-output/planning-artifacts/architecture.md` ✅

## Dev Notes

### What This Story Produces

A single file: `README.md` at the project root. The current file contains only a placeholder line (`## Not ready for review yet submitted accidentally`) and must be **replaced entirely**.

This is a documentation-only story. No TypeScript, no Vue components, no backend routes, no test files. The only "implementation" is writing accurate Markdown.

### Verified Commands and URLs

All of the following have been verified to work as of story 4.3 (2026-04-23):

```bash
# Full install (from project root)
npm install

# DB migration (must be run before first dev start)
npm run db:migrate --workspace=backend

# Dev (starts both servers concurrently — uses concurrently package)
npm run dev
# → frontend Vite dev server: http://localhost:5173
# → backend Fastify:           http://localhost:3000

# Production build
npm run build
# → frontend dist: frontend/dist/  (vite build + vue-tsc type-check)
# → backend dist:  backend/dist/   (tsc)

# Tests
npm run test
# → runs: npm run test --workspace=frontend && npm run test --workspace=backend (concurrently)
# → frontend: 30 tests (Vitest + @vue/test-utils)
# → backend:  29 tests (Vitest)

# Lint (frontend only — backend has no lint config)
npm run lint --workspace=frontend
# → oxlint then ESLint

# DB schema generate (when schema.ts is changed)
npm run db:generate --workspace=backend
```

### Environment Setup — What the README Must Explain

`backend/.env.example` contains:
```
# SQLite database file path (relative to backend/ root)
DB_FILE_NAME=file:local.db

# Frontend origin allowed by CORS
ALLOWED_ORIGIN=http://localhost:5173
```

Step 3 of Local Setup is: `cp backend/.env.example backend/.env`
The `.env` values are already correct for local dev — no manual editing required after copy.

The SQLite database file (`local.db`) is created automatically by Drizzle on first migration. The migration command creates all tables.

### Project Structure — Accurate Tree

```
bmad-todo-app/
├── frontend/           # Vue 3 SPA (TypeScript, Vite, Tailwind CSS v4)
│   ├── src/            # Application source
│   │   ├── api/        # HTTP client and API functions
│   │   ├── components/ # Vue components + unit tests
│   │   ├── composables/# TanStack Vue Query composables
│   │   ├── router/     # Vue Router configuration
│   │   ├── stores/     # Pinia UI state stores
│   │   ├── types/      # Shared TypeScript types
│   │   └── views/      # Page-level view components
│   └── dist/           # Production build output (git-ignored)
├── backend/            # Fastify REST API (TypeScript, Drizzle ORM, SQLite)
│   ├── src/            # Application source
│   │   ├── db/         # Drizzle schema and DB connection
│   │   ├── plugins/    # Fastify plugins (CORS, error handler)
│   │   ├── routes/     # Route handlers
│   │   └── types/      # Shared TypeScript types
│   ├── drizzle/        # Generated SQL migrations
│   └── dist/           # Production build output (git-ignored)
├── _bmad-output/       # BMad planning and implementation artifacts (not app code)
│   ├── planning-artifacts/   # PRD, architecture, epics
│   └── implementation-artifacts/ # Story files, sprint status
└── package.json        # Root workspace manifest (npm workspaces)
```

### Tech Stack — Precise Versions (from package.json)

**Frontend:**
- Vue 3.5 + TypeScript 6
- Vite 8 (build tool)
- Tailwind CSS v4 (configured via `@import "tailwindcss"` in CSS — no `tailwind.config.js`)
- TanStack Vue Query v5 (server state / caching)
- Pinia v3 (UI state only)
- Vue Router v5

**Backend:**
- Fastify v5
- Drizzle ORM + @libsql/client (SQLite)
- TypeScript 6 / tsx (dev hot-reload)
- dotenv

**Testing:**
- Vitest v4
- @vue/test-utils v2 (frontend component tests)

### Root package.json Scripts — Exact Definitions

```json
"scripts": {
  "dev":   "concurrently \"npm run dev --workspace=frontend\" \"npm run dev --workspace=backend\"",
  "build": "npm run build --workspace=frontend && npm run build --workspace=backend",
  "test":  "concurrently \"npm run test --workspace=frontend\" \"npm run test --workspace=backend\""
}
```

### Acceptance Criteria Checklist

| AC | Section to cover |
|----|-----------------|
| #1 | Overview — purpose, persona (Alex), features |
| #2 | Prerequisites — Node ≥ 20.19.0, npm ≥ 10 |
| #3 | Local Setup — 5 numbered steps: clone → install → copy env → migrate → run |
| #4 | Available Scripts — `dev`, `build`, `test` with descriptions |
| #5 | Project Structure — `frontend/`, `backend/`, `_bmad-output/`, root `package.json` |
| #6 | Further Reading — links to `prd.md` and `architecture.md` |

### Previous Story Intelligence

- **Git commit pattern**: `feat: story X.X — Story Title` (e.g., `feat: story 5.1 — Project README`)
- **No lint gate** for `README.md` — oxlint and ESLint only scan `.ts`, `.vue`, `.js` files
- **No test file needed** — this story produces only Markdown; no test framework covers README content
- **Definition of Done still requires**: running `npm run test` to confirm no regressions from the file change (there will be none, but the workflow requires it)

### References

- [Epic 5 Story 5.1 definition — Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]
- [Root package.json scripts — Source: package.json]
- [Backend env vars — Source: backend/.env.example]
- [Node version constraint — Source: frontend/package.json `engines` field]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

(none)

### Completion Notes List

- Replaced single-line placeholder in `README.md` with 85-line full README covering all 6 ACs.
- All commands verified against actual scripts in `package.json`, `frontend/package.json`, `backend/package.json`.
- Both linked files (`prd.md`, `architecture.md`) confirmed to exist at the paths given in Further Reading.
- 59/59 tests pass. No regressions from a documentation-only change.

### File List

- `README.md` (modified — replaced placeholder with complete project README)

## Change Log

- 2026-04-23 — Story 5.1 implementation: replaced placeholder `README.md` with full project README covering Overview, Tech Stack, Prerequisites, Local Setup, Available Scripts, Project Structure, and Further Reading sections. All 6 ACs satisfied. 59/59 tests pass.

### Review Findings

- [x] [Review][Patch] Missing newline at end of file [`README.md`] — diff ends with `\ No newline at end of file`; POSIX text files must end with `\n`
