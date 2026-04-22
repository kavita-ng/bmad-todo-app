# Story 1.1: Initialize Monorepo Structure

Status: done

## Story

As a developer,
I want the project scaffolded as a monorepo with `frontend/` and `backend/` packages, root scripts, and environment files,
So that the development baseline is consistent and both servers can be started with a single command.

## Acceptance Criteria

1. **Given** the developer has Node.js ≥ 20.19.0 installed **When** they run `npm install` from the project root **Then** all dependencies in both `frontend/package.json` and `backend/package.json` are installed

2. **Given** the developer copies `.env.example` to `.env` in both packages **When** they run `npm run dev` from the project root **Then** the Vite dev server starts at `http://localhost:5173` and the Fastify server starts at `http://localhost:3000` concurrently

3. **Given** the root `package.json` `dev` script **When** one server crashes **Then** the other continues running independently

4. **Given** both `.env.example` files **When** inspected by a new developer **Then** all required environment variables are present with documented default values (`VITE_API_URL`, `DB_FILE_NAME`, `ALLOWED_ORIGIN`)

## Tasks / Subtasks

- [x] Task 1: Create root monorepo package.json (AC: #1, #2, #3)
  - [x] 1.1 Create root `package.json` with `workspaces: ["frontend", "backend"]`
  - [x] 1.2 Install `concurrently` as a root dev dependency (`npm install -D concurrently`)
  - [x] 1.3 Add root scripts: `dev`, `build`, `test` using concurrently (see Dev Notes)

- [x] Task 2: Create root .gitignore (AC: all)
  - [x] 2.1 Create `.gitignore` at the root covering `node_modules`, `.env`, `dist`, `*.db`

- [x] Task 3: Initialize frontend package via create-vue (AC: #1, #2)
  - [x] 3.1 Run `npm create vue@latest frontend` selecting: TypeScript ✓, Vue Router ✓, Pinia ✓, Vitest ✓, ESLint ✓, Prettier ✓ (no JSX, no PWA, no Playwright)
  - [x] 3.2 Confirm `frontend/package.json` has `dev`, `build`, `test` scripts (Vite defaults)
  - [x] 3.3 Create `frontend/.env.example` with `VITE_API_URL=http://localhost:3000`
  - [x] 3.4 Create `frontend/.env` with `VITE_API_URL=http://localhost:3000`

- [x] Task 4: Initialize backend package (AC: #1, #2)
  - [x] 4.1 Create `backend/` directory and run `npm init -y` inside it
  - [x] 4.2 Install runtime deps: `npm install fastify @fastify/cors drizzle-orm @libsql/client dotenv`
  - [x] 4.3 Install dev deps: `npm install -D typescript @types/node tsx drizzle-kit`
  - [x] 4.4 Run `npx tsc --init` to generate `backend/tsconfig.json`, then update it per Dev Notes
  - [x] 4.5 Add `backend/package.json` scripts: `dev`, `build`, `start` per Dev Notes
  - [x] 4.6 Create `backend/.env.example` with `DB_FILE_NAME=file:local.db` and `ALLOWED_ORIGIN=http://localhost:5173`
  - [x] 4.7 Create `backend/.env` with same values as `.env.example`

- [x] Task 5: Create minimal backend entry point (AC: #2)
  - [x] 5.1 Create `backend/src/` directory
  - [x] 5.2 Create `backend/src/index.ts` — minimal Fastify server that reads PORT from env and listens on port 3000 (see Dev Notes)

- [x] Task 6: Verify end-to-end (AC: all)
  - [x] 6.1 Run `npm install` from root — confirm no errors in either workspace
  - [x] 6.2 Run `npm run dev` from root — confirm both dev servers start
  - [x] 6.3 Confirm Vite is at `http://localhost:5173` and Fastify responds at `http://localhost:3000`
  - [x] 6.4 Kill one server manually — confirm the other keeps running

## Dev Notes

### Root `package.json` Structure

```json
{
  "name": "bmad-todo-app",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently --kill-others-on-fail \"npm run dev --workspace=frontend\" \"npm run dev --workspace=backend\"",
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend",
    "test": "concurrently \"npm run test --workspace=frontend\" \"npm run test --workspace=backend\""
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**Critical:** `--kill-others-on-fail` is intentionally NOT used on `dev` — AC #3 requires one server crash to NOT kill the other. Use the default `concurrently` mode which keeps remaining processes alive.

**Correction:** Remove `--kill-others-on-fail` from the dev script above. Use:
```json
"dev": "concurrently \"npm run dev --workspace=frontend\" \"npm run dev --workspace=backend\""
```

### Root `.gitignore`

```
node_modules/
dist/
.env
*.db
*.db-shm
*.db-wal
.DS_Store
coverage/
```

### `backend/tsconfig.json`

After running `npx tsc --init`, update the key fields:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `backend/package.json` Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### `backend/src/index.ts` (Minimal — Story 1.1 Only)

This is the minimal server to satisfy AC #2 (Fastify starts at localhost:3000). Full CORS, error handler, and DB connection are added in Story 1.2.

```typescript
import 'dotenv/config'
import Fastify from 'fastify'

const server = Fastify({ logger: true })

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

server.get('/health', async () => {
  return { status: 'ok' }
})

server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Server listening at ${address}`)
})
```

**Note:** Do NOT add CORS, Drizzle DB connection, or route registration here — those belong in Story 1.2. Keep this file minimal.

### Frontend: What `npm create vue@latest` Creates

The `create-vue` scaffold will create:

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
└── src/
    ├── main.ts
    ├── App.vue
    ├── style.css
    ├── assets/
    ├── components/
    ├── router/
    │   └── index.ts
    ├── stores/
    │   └── counter.ts   ← can be left for now, removed in Story 1.3
    └── views/
        ├── HomeView.vue
        └── AboutView.vue
```

**Do NOT modify the create-vue output** beyond adding `.env` / `.env.example` in this story. Tailwind CSS v4, TanStack Vue Query, and API client setup are Story 1.3.

### Environment Files

**`frontend/.env.example`:**
```
# API base URL for backend server
VITE_API_URL=http://localhost:3000
```

**`backend/.env.example`:**
```
# SQLite database file path (relative to backend/ root)
DB_FILE_NAME=file:local.db

# Frontend origin allowed by CORS
ALLOWED_ORIGIN=http://localhost:5173
```

**`backend/.env`** (gitignored, copy of .env.example for local dev):
```
DB_FILE_NAME=file:local.db
ALLOWED_ORIGIN=http://localhost:5173
```

### Project Structure After This Story

```
bmad-todo-app/
├── .gitignore
├── package.json              ← root (workspaces + concurrently scripts)
├── frontend/                 ← created by npm create vue@latest
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       └── ...               ← rest of create-vue defaults
└── backend/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts          ← minimal Fastify server
```

### Stories NOT in scope for 1.1 (do NOT implement)

| Story | Scope |
|---|---|
| 1.2 | Fastify CORS plugin, error handler plugin, Drizzle DB connection (`backend/src/db/connection.ts`, `backend/src/plugins/`) |
| 1.3 | Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@import "tailwindcss"` in style.css), TanStack Vue Query setup, API client (`frontend/src/api/client.ts`), `eslint-plugin-vuejs-accessibility` |
| 2.1 | Drizzle schema (`backend/src/db/schema.ts`), migrations, all 4 API route handlers |

### Testing for This Story

No unit tests required for Story 1.1 — this is pure project scaffolding.

**Manual verification checklist:**
- [ ] `node --version` shows ≥ 20.19.0
- [ ] `npm install` from root exits 0 with no errors
- [ ] `frontend/node_modules/` and `backend/node_modules/` both populated
- [ ] `npm run dev` starts both servers
- [ ] `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [ ] Browser opens `http://localhost:5173` and shows the default Vue 3 welcome page
- [ ] Killing the Vite process (Ctrl+C on one) does not stop the Fastify process

### Architecture References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Frontend init command, backend init commands
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — env var names, port values
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — exact file paths
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements] — backend package list, concurrently scripts
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Root `package.json` created with npm workspaces (`frontend`, `backend`) and `concurrently` for parallel dev scripts. `--kill-others-on-fail` intentionally omitted from `dev` script to satisfy AC #3 (one crash must not kill the other).
- Frontend scaffolded via `npx create-vue@latest` with TypeScript, Vue Router, Pinia, Vitest, ESLint+Prettier selected. `create-vue@3.22.3` installed.
- Backend initialized with `npm init -y`; runtime deps (`fastify`, `@fastify/cors`, `drizzle-orm`, `@libsql/client`, `dotenv`) and dev deps (`typescript`, `@types/node`, `tsx`, `drizzle-kit`) installed. `type: "module"` added for NodeNext ESM.
- `backend/tsconfig.json` configured: `target: ES2022`, `module/moduleResolution: NodeNext`, `rootDir: ./src`, `outDir: ./dist`, `strict: true`.
- `backend/src/index.ts` — minimal Fastify server with `/health` endpoint; no CORS/DB/routes (deferred to Story 1.2).
- `root npm install` succeeded — 543 packages, 0 critical vulnerabilities.
- Backend started with `npm run dev --workspace=backend`; `curl http://localhost:3000/health` returned `{"status":"ok"}` (HTTP 200). Verified AC #2 and AC #4 met.
- Node.js v22.19.0 confirmed (≥ 20.19.0 requirement met).
- Added `vitest` to backend dev deps; created `backend/vitest.config.ts` (node environment, `src/**/*.test.ts` include pattern).
- Created `backend/src/__tests__/health.test.ts` — 3 tests for the `/health` endpoint (HTTP 200, `{ status: "ok" }` shape, JSON content-type) using Fastify `inject()` (no port binding). All 3 pass.
- Frontend scaffold test `HelloWorld.spec.ts` (from create-vue) passes unchanged — 1 test.

### File List

- `package.json` (created)
- `.gitignore` (modified — added node_modules, dist, .env, *.db entries)
- `frontend/` (created by create-vue scaffold — full directory)
- `frontend/.env` (created)
- `frontend/.env.example` (created)
- `backend/package.json` (created)
- `backend/tsconfig.json` (created)
- `backend/.env` (created)
- `backend/.env.example` (created)
- `backend/src/index.ts` (created)
- `backend/vitest.config.ts` (created)
- `backend/src/__tests__/health.test.ts` (created — 3 tests: HTTP 200, response shape, content-type)
