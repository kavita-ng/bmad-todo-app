---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation]
inputDocuments: [prd.md]
workflowType: 'architecture'
project_name: 'bmad-todo-app'
user_name: 'Kavita'
date: '2026-04-22'
---

# Architecture Decision Document

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
29 FRs across 6 areas: Todo Management (FR1–4), Status Management (FR5–8), Data Persistence (FR9–11), UI Display (FR12–17), UI Interactions (FR18–20), Responsiveness & Device Support (FR21–23), API & Backend (FR24–29). Core data entity is a single `Todo` with: text description, five-state status, creation timestamp. No relational complexity — flat list, single entity type.

**Non-Functional Requirements:**
- Performance: < 200ms UI action round-trip; < 3s initial load; optimistic UI updates mandatory
- Reliability: Zero data loss — todos persist across refreshes, sessions, server restarts; failed writes must not corrupt state
- Accessibility: WCAG 2.1 AA — keyboard navigable, screen-reader compatible, status not conveyed by colour alone

**Scale & Complexity:**
- Primary domain: Full-stack SPA + REST API
- Complexity level: Low — single user, no auth, no multi-tenancy, no third-party integrations, flat data model
- Architectural components: Frontend SPA, REST API backend, persistent data store

### Technical Constraints & Dependencies

- No authentication or session management in v1
- No WebSockets or server-push — all updates user-triggered via HTTP
- API base URL must be configurable via environment variable
- CORS must be configured on backend for frontend origin
- No service worker / offline caching — connectivity loss surfaces error state only
- Must not prevent future addition of auth and multi-user without full rewrite

### Cross-Cutting Concerns Identified

- **Optimistic UI vs. reliability tension:** Frontend updates immediately on user action; API failure must trigger clean UI rollback without data corruption
- **Error propagation:** Both client and server must handle failures gracefully — unified error state pattern needed
- **Extensibility seam:** Data model and API design must leave room for user identity (future auth) without requiring it now

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — Vue 3 SPA frontend + Node.js REST API backend, single-user, local deployment.

### Starter Options Considered

**Frontend:** `npm create vue@latest` (official `create-vue` scaffolding tool, Vite-based) — canonical Vue 3 + TypeScript starter. No viable competitors for Vue 3 SPA; this is the authoritative path.\
**Backend:** Fastify + TypeScript + Drizzle ORM + libsql/SQLite assembled manually — lightweight, TypeScript-native, built-in schema validation, zero framework overhead for a 4-endpoint API.\
**ORM:** Drizzle ORM — TypeScript-first, schema-as-code, excellent SQLite support via `libsql`. Preferred over Prisma for this scope (leaner, TypeScript-native).

### Selected Stack: Vue 3 + TypeScript + Fastify + Drizzle ORM + SQLite

**Rationale:** Monorepo with two packages (`frontend/`, `backend/`) keeps the project navigable without the overhead of a full-stack framework. The API is 4 endpoints — a full framework would be overkill. Fastify preferred over Express for built-in TypeScript types, JSON Schema validation on routes, and better performance.

### Frontend Initialization Command

```bash
npm create vue@latest frontend
# Select: TypeScript ✓ | Vue Router ✓ | Pinia ✓ | Vitest ✓ | ESLint ✓ | Prettier ✓
```

### Backend Initialization

```bash
mkdir backend && cd backend
npm init -y
npm install fastify @fastify/cors drizzle-orm @libsql/client dotenv
npm install -D typescript @types/node tsx drizzle-kit
npx tsc --init
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript strict mode throughout — both packages share the same language and can share type definitions (e.g. `Todo` interface)
- Node.js ≥ 20.19.0 required (LTS)

**Styling Solution (Frontend):**
- No styling library pre-selected by `create-vue` — decision deferred to architectural decisions step

**Build Tooling:**
- Frontend: Vite (provided by `create-vue`) — fast HMR, optimised production builds
- Backend: `tsx` for development (direct TypeScript execution), `tsc` for production build

**Testing Framework:**
- Frontend: Vitest (unit) — provided by `create-vue`
- Backend: Vitest compatible — same test runner both sides

**Code Organisation:**

```
bmad-todo-app/
├── frontend/          # Vue 3 SPA (create-vue output)
│   └── src/
│       ├── components/
│       ├── stores/    # Pinia stores
│       ├── views/
│       └── api/       # API client layer
├── backend/           # Fastify + Drizzle
│   └── src/
│       ├── db/        # Drizzle schema + connection
│       ├── routes/    # Fastify route handlers
│       └── index.ts
│   └── drizzle/       # Migration files
└── package.json       # Root scripts (optional)
```

**Development Experience:**
- Frontend: `npm run dev` → Vite dev server with HMR
- Backend: `npx tsx watch src/index.ts` → hot-reload on file change
- API base URL via `VITE_API_URL` env var on frontend; `DB_FILE_NAME` on backend

**Note:** Project initialisation using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model schema (Todo entity with tags)
- API contract (endpoints, query params, pagination shape)
- Frontend data-fetching strategy (TanStack Vue Query)
- Styling approach (Tailwind CSS v4)

**Important Decisions (Shape Architecture):**
- UUID primary keys
- Status enum enforced at DB level
- PATCH semantics for partial updates
- Optimistic mutation pattern

**Deferred Decisions (Post-MVP):**
- Authentication / user identity
- Production hosting and deployment
- Advanced filtering beyond status

### Data Architecture

**Todo Schema:**

```typescript
// backend/src/db/schema.ts
export const todos = sqliteTable('todos', {
  id:          text('id').primaryKey(),           // UUID — no sequential ID leakage
  description: text('description').notNull(),
  status:      text('status', {
                 enum: ['draft', 'ready', 'in_progress', 'backlog', 'completed']
               }).notNull().default('draft'),
  tags:        text('tags').notNull().default(''), // Comma-separated, e.g. "work,urgent"
  createdAt:   integer('created_at', { mode: 'timestamp' })
                 .notNull().$defaultFn(() => new Date()),
})
```

- **ID:** UUID (`crypto.randomUUID()`) — avoids sequential ID leakage, future-safe for multi-user
- **Status:** SQLite enum constraint — invalid states cannot be persisted
- **Tags:** Stored as comma-separated string in SQLite; serialised/deserialised at the API layer to/from `string[]`. No separate join table needed for v1; migration path exists if tags need querying in future.
- **createdAt:** SQLite integer timestamp; Drizzle handles JS `Date` ↔ integer conversion

**Shared type (frontend + backend):**

```typescript
export interface Todo {
  id: string
  description: string
  status: 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'
  tags: string[]
  createdAt: Date
}
```

**Migration approach:** Drizzle Kit `push` for local dev; `generate` + `migrate` when moving to production.

### API & Communication Patterns

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/todos` | Retrieve todos (supports pagination + status filter) |
| `POST` | `/api/todos` | Create a new todo |
| `PATCH` | `/api/todos/:id` | Partial update (status, description, tags) |
| `DELETE` | `/api/todos/:id` | Delete a todo |

**GET `/api/todos` query params:**

```
/api/todos?status=in_progress&page=1&limit=20
```

- `status` — optional; one of the five enum values; omit for all todos
- `page` — optional; 1-indexed; defaults to 1
- `limit` — optional; max items per page; defaults to 50; capped at 100

**Response envelope for paginated list:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 23,
    "hasMore": false
  }
}
```

**Error responses:** Fastify JSON Schema validation → 400 on invalid input. 404 on unknown `:id`. 500 on DB failure with sanitised message (no stack traces in responses).

**Tags serialisation:** API always receives and returns `tags` as `string[]`; backend converts to/from comma-separated string at the DB boundary.

**CORS:** `@fastify/cors` allows `http://localhost:5173` in development. Origin configurable via `ALLOWED_ORIGIN` env var.

### Frontend Architecture

**Data fetching & server state: `@tanstack/vue-query`**

- `useQuery` for `GET /api/todos` (query key includes active filters/page)
- `useMutation` for create, update, delete — with optimistic updates via `onMutate` + rollback via `onError`
- Cache invalidation on mutation success via `queryClient.invalidateQueries`
- Satisfies NFR4 (optimistic UI) and NFR6 (no data corruption on failure)

**Local/UI state: Pinia** (non-server state only)
- Active filter state (selected status, current page)
- UI flags (form state, loading indicators)

**Routing:** Vue Router — single route `/` for v1

**Component structure:**

```
src/
├── components/
│   ├── TodoList.vue         # List container
│   ├── TodoItem.vue         # Single todo row
│   ├── TodoForm.vue         # Add todo input
│   ├── StatusBadge.vue      # Status pill (all 5 states)
│   └── FilterBar.vue        # Status filter + pagination
├── stores/
│   └── ui.ts                # Pinia — filter/pagination UI state
├── api/
│   └── todos.ts             # Fetch wrapper for all todo endpoints
└── views/
    └── HomeView.vue
```

### Styling

**Tailwind CSS v4** — utility-first, zero runtime, CSS-first configuration.

```bash
npm install tailwindcss @tailwindcss/vite
```

Configured via `@import "tailwindcss"` in the main CSS entry — no `tailwind.config.js` needed.

- Status badge variants handled via Tailwind colour utilities per state
- Responsive layout via Tailwind breakpoint prefixes
- WCAG AA contrast enforced via colour choices at design time

### Infrastructure & Deployment

- **Dev environment:** Vite dev server (`localhost:5173`) + Fastify (`localhost:3000`), run concurrently
- **Environment config:** `.env` per package; `.env.example` committed; actual `.env` gitignored
  - Frontend: `VITE_API_URL=http://localhost:3000`
  - Backend: `DB_FILE_NAME=file:local.db`, `ALLOWED_ORIGIN=http://localhost:5173`
- **No production deployment in v1** — local only

### Decision Impact Analysis

**Implementation Sequence:**
1. Backend: DB schema + Drizzle setup
2. Backend: Fastify routes (all 4 endpoints)
3. Frontend: Scaffold via `create-vue`, install Tailwind v4 + `@tanstack/vue-query`
4. Frontend: API client layer (`src/api/todos.ts`)
5. Frontend: Pinia UI store
6. Frontend: Components (TodoForm → TodoList → TodoItem → StatusBadge → FilterBar)

**Cross-Component Dependencies:**
- `Todo` type shared between frontend API client and backend routes — duplicate intentionally for v1; extract to `shared/` package post-MVP
- TanStack Query cache key must include filter state — `['todos', { status, page }]`
- Tags serialisation/deserialisation must be consistent at API boundary — single utility function, tested

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions:**
- Table names: `snake_case` plural — `todos`
- Column names: `snake_case` — `created_at`, `todo_id`
- No Hungarian notation, no prefixes

**API Naming Conventions:**
- Endpoints: `kebab-case` plural nouns — `/api/todos`
- Route parameters: `:id` (Fastify convention)
- Query parameters: `camelCase` — `?status=in_progress&page=1&limit=20`
- JSON response fields: `camelCase` throughout — `createdAt`, `hasMore`

**Code Naming Conventions:**
- Vue components: `PascalCase` files and names — `TodoItem.vue`, `StatusBadge.vue`
- Composables: `camelCase` with `use` prefix — `useTodos.ts`
- Pinia stores: `camelCase` with `use` prefix, `Store` suffix — `useUiStore`
- TypeScript interfaces: `PascalCase` — `Todo`, `PaginatedResponse`
- Constants: `SCREAMING_SNAKE_CASE` — `STATUS_VALUES`
- Backend route files: `kebab-case` — `todos.routes.ts`
- Backend DB files: `kebab-case` — `todos.schema.ts`, `db.ts`

### Structure Patterns

**Test co-location:**
- Unit tests: co-located with source — `TodoItem.test.ts` next to `TodoItem.vue`
- Integration/API tests: `backend/src/__tests__/`
- Test file suffix: `.test.ts` (not `.spec.ts`)

**Import ordering** (ESLint enforced):
1. Node built-ins
2. External packages
3. Internal aliases (`@/`)
4. Relative imports

**No barrel files (`index.ts`)** — import directly from source files to avoid circular dependency issues.

### Format Patterns

**API Response Formats:**

All list responses wrapped:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 50, "total": 23, "hasMore": false }
}
```

All single-resource responses: direct object (no wrapper):
```json
{ "id": "...", "description": "...", "status": "draft", "tags": [], "createdAt": "..." }
```

**Error response format** (all errors):
```json
{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }
```
- `code`: `SCREAMING_SNAKE_CASE` string (machine-readable)
- `message`: human-readable string (safe to display)
- No stack traces in responses

**Date format:** ISO 8601 strings in JSON — `"2026-04-22T14:00:00.000Z"`. Serialise via `.toISOString()` at the API boundary.

**Tags:** Always `string[]` in API (never raw comma-separated string). Empty tags = `[]` (never `null`).

**Status values:** Always lowercase with underscores in API — `"in_progress"` (not `"In Progress"` or `"IN_PROGRESS"`).

### Communication Patterns (Frontend)

**TanStack Query cache keys:**
```typescript
const todoKeys = {
  all: ['todos'] as const,
  filtered: (filters: TodoFilters) => ['todos', filters] as const,
}
```

**Optimistic mutation pattern** — all mutations follow this structure:
```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: todoKeys.all })
    const previous = queryClient.getQueryData(todoKeys.filtered(filters))
    queryClient.setQueryData(todoKeys.filtered(filters), /* optimistic update */)
    return { previous }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(todoKeys.filtered(filters), context?.previous)
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
})
```

**Pinia store actions:** `camelCase` verb-noun — `setStatusFilter`, `setPage`, `resetFilters`

### Process Patterns

**Error handling:**
- Backend: All route handlers wrapped in try/catch; Fastify error handler plugin for consistent error serialisation
- Frontend: TanStack Query `onError` callbacks handle API errors; `error` state from `useQuery`/`useMutation` drives UI error states
- User-facing messages: generic ("Something went wrong. Please try again.") unless error is user-actionable
- Never log sensitive data; backend logs use structured format: `{ level, message, requestId }`

**Loading states:**
- Use TanStack Query `isPending` / `isFetching` — not manual boolean flags
- `isPending`: initial load (show skeleton/spinner)
- `isFetching`: background refetch (show subtle indicator, not full spinner)
- Mutations: `isPending` on `useMutation` drives button disabled state

**Input validation:**
- Backend: Fastify JSON Schema on every route (request body + query params) — first line of defence
- Frontend: basic client-side validation before submit (non-empty description, valid status) — UX only, not security

### Enforcement Guidelines

**All AI agents MUST:**
- Use `camelCase` for all JSON fields (API and frontend)
- Return `tags` as `string[]` — never the raw DB string
- Use the standard error response shape `{ error: { code, message } }`
- Use the `todoKeys` factory for all TanStack Query cache keys
- Follow the optimistic mutation pattern for all write operations
- Co-locate test files with source files (`.test.ts` suffix)
- Never expose stack traces or DB error details in API responses

**Anti-patterns to avoid:**
- ❌ `snake_case` JSON fields in API responses
- ❌ Wrapping single-resource responses in `{ data: ... }`
- ❌ Using `null` for empty tags (use `[]`)
- ❌ Manual `isLoading` boolean state alongside TanStack Query
- ❌ Barrel `index.ts` files

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-todo-app/
├── .env.example                    # Root env example (documents all vars)
├── .gitignore
├── README.md
├── package.json                    # Root scripts: dev, build, test (concurrently)
│
├── frontend/                       # Vue 3 SPA (create-vue output)
│   ├── .env
│   ├── .env.example                # VITE_API_URL=http://localhost:3000
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── src/
│       ├── main.ts                 # App entry — mounts Vue, registers plugins
│       ├── App.vue                 # Root component
│       ├── style.css               # @import "tailwindcss"
│       ├── types/
│       │   └── todo.ts             # Todo, TodoFilters, PaginatedResponse types
│       ├── api/
│       │   ├── client.ts           # Base fetch wrapper (base URL, error handling)
│       │   └── todos.ts            # All todo API calls (getTodos, createTodo, etc.)
│       ├── stores/
│       │   └── ui.ts               # Pinia — filter/pagination state only
│       ├── composables/
│       │   └── useTodos.ts         # TanStack Vue Query hooks (useQuery, useMutation)
│       ├── components/
│       │   ├── TodoForm.vue        # Add-todo input + submit
│       │   ├── TodoList.vue        # List container, empty/loading/error states
│       │   ├── TodoItem.vue        # Single todo row (description, status, tags, delete)
│       │   ├── StatusBadge.vue     # Status pill for all 5 states
│       │   └── FilterBar.vue       # Status filter dropdown + pagination controls
│       ├── views/
│       │   └── HomeView.vue        # Single view — composes all components
│       └── router/
│           └── index.ts            # Vue Router — single route '/'
│
└── backend/                        # Fastify + Drizzle
    ├── .env
    ├── .env.example                # DB_FILE_NAME=file:local.db, ALLOWED_ORIGIN=...
    ├── package.json
    ├── tsconfig.json
    ├── drizzle.config.ts           # Drizzle Kit config
    ├── drizzle/                    # Migration files (generated by drizzle-kit)
    │   └── migrations/
    └── src/
        ├── index.ts                # Fastify server entry — registers plugins, starts
        ├── app.ts                  # App factory — registers routes, error handler
        ├── types/
        │   └── todo.ts             # Todo, CreateTodoBody, UpdateTodoBody types
        ├── db/
        │   ├── connection.ts       # Drizzle client initialisation (libsql)
        │   └── schema.ts           # Drizzle table schema (todos)
        ├── routes/
        │   └── todos.routes.ts     # All 4 todo endpoints with JSON Schema validation
        ├── plugins/
        │   ├── cors.ts             # @fastify/cors registration
        │   └── error-handler.ts    # Global error serialiser
        ├── utils/
        │   └── tags.ts             # serializeTags / deserializeTags (string[] ↔ CSV)
        └── __tests__/
            └── todos.routes.test.ts # Integration tests for all API routes
```

### Architectural Boundaries

**API Boundary:**
- All client ↔ server communication via `frontend/src/api/` only — no direct fetch calls in components
- `frontend/src/api/client.ts` owns base URL, default headers, and error shape normalisation
- `frontend/src/api/todos.ts` owns all todo-specific endpoints

**Component Boundary:**
- Components own rendering and user events only — no direct API calls
- `useTodos.ts` composable owns all server state (TanStack Query) — components consume via composable
- `ui.ts` Pinia store owns UI state (filters, pagination) — components read/write via store

**Data Boundary:**
- `backend/src/db/` owns all database access — no Drizzle calls outside this directory
- `backend/src/utils/tags.ts` is the single point of tags serialisation — used exclusively in routes
- `backend/src/routes/` owns request validation and response shaping — no business logic in `index.ts`

### Requirements to Structure Mapping

| FR Category | Frontend | Backend |
|---|---|---|
| Todo Management (FR1–4) | `TodoForm.vue`, `TodoList.vue`, `TodoItem.vue` | `todos.routes.ts` (POST, GET, DELETE) |
| Status Management (FR5–8) | `StatusBadge.vue`, `TodoItem.vue` | `schema.ts` (enum), `todos.routes.ts` (PATCH) |
| Data Persistence (FR9–11) | `useTodos.ts` (cache invalidation) | `db/`, `routes/` |
| UI Display (FR12–17) | `TodoList.vue` (empty/loading/error), `StatusBadge.vue` | — |
| UI Interactions (FR18–20) | `TodoForm.vue`, `useTodos.ts` (optimistic) | — |
| Responsiveness (FR21–23) | Tailwind breakpoints in all components | — |
| API & Backend (FR24–29) | `api/todos.ts` | `routes/todos.routes.ts` |
| Tags | `TodoItem.vue`, `TodoForm.vue` | `utils/tags.ts`, `schema.ts` |
| Pagination + Filter | `FilterBar.vue`, `ui.ts` | `todos.routes.ts` (query params) |

### Data Flow

```
User action (e.g. status change)
  → TodoItem.vue calls useTodos.ts mutation
    → Optimistic update applied to TanStack Query cache
    → api/todos.ts PATCH /api/todos/:id
      → Fastify route validates JSON Schema
        → Drizzle PATCH query on SQLite
          → Success: cache invalidated, UI confirmed
          → Failure: cache rolled back, error state shown
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible and version-aligned. Vue 3, TanStack Vue Query, Pinia, Vue Router, and Tailwind v4 are all v3-era packages with no version conflicts. Fastify, Drizzle ORM, and libsql are all TypeScript-native with no conflicts.

**Pattern Consistency:**
Naming conventions are consistent across all layers: `snake_case` in SQLite/Drizzle schema, `camelCase` in JSON API and TypeScript, `PascalCase` for Vue components, `kebab-case` for files. Optimistic mutation pattern (onMutate/onError/onSettled) aligns with TanStack Vue Query's canonical API. Error shape `{ error: { code, message } }` is defined once and enforced at the Fastify error handler boundary.

**Structure Alignment:**
Project structure cleanly separates concerns. API boundary (`frontend/src/api/`), component boundary (composables own server state, Pinia owns UI state), and data boundary (`backend/src/db/`, single tags serialisation utility) are all well-defined and non-overlapping.

### Requirements Coverage Validation ✅

**Feature Coverage:**
All 29 Functional Requirements across 9 FR categories are architecturally supported with explicit file-to-requirement mappings. All 5 todo statuses are handled via the Drizzle enum and StatusBadge component. Tags, pagination, and filtering all have dedicated architectural support.

**Non-Functional Requirements:**
- Performance (< 200ms actions, optimistic UI): covered by TanStack Query optimistic mutations and Vite build output
- Reliability (zero data loss): covered by SQLite durability and optimistic rollback on mutation failure
- Accessibility (WCAG 2.1 AA): addressed — `eslint-plugin-vuejs-accessibility` added to frontend ESLint config as the enforcement mechanism

### Implementation Readiness Validation ✅

Architecture is complete and ready to guide AI agent implementation:
- All critical decisions documented with specific package names and versions
- Project structure maps every requirement to specific files with annotated responsibilities
- Naming conventions cover all layers with explicit examples
- All potential conflict points addressed (JSON casing, tags format, error shape, TanStack Query key structure)
- Optimistic mutation pattern provided as code template
- Init commands documented for both frontend and backend packages

### Gaps Resolved

| Gap | Severity | Resolution |
|---|---|---|
| Accessibility enforcement mechanism | Important | `eslint-plugin-vuejs-accessibility` in frontend ESLint config — catches WCAG violations at dev time |

### Validation Verdict

**Architecture is COMPLETE and IMPLEMENTATION READY.** No blocking gaps. All requirements covered. All patterns specified. Ready for epic and story breakdown.
