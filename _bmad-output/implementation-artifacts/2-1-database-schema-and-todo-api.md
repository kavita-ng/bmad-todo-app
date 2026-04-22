# Story 2.1: Database Schema and Todo API

Status: done

## Story

As a developer,
I want the `todos` table created via a Drizzle migration and all four API endpoints implemented,
So that the frontend has a complete, tested backend to call for all core todo operations.

## Acceptance Criteria

1. **Given** `npx drizzle-kit migrate` is run against an empty database
   **When** the migration completes
   **Then** a `todos` table exists with columns: `id` (TEXT UUID, PK), `description` (TEXT NOT NULL), `status` (TEXT, default `draft`), `tags` (TEXT, default `''`), `created_at` (INTEGER unix ms), `updated_at` (INTEGER unix ms)

2. **Given** a `POST /api/todos` request with body `{ "description": "Buy milk" }`
   **When** the route handles it
   **Then** a new todo is created with a generated UUID, status `draft`, current `created_at`, and the response returns the full todo object with HTTP 201

3. **Given** a `GET /api/todos` request
   **When** todos exist in the database
   **Then** the response returns a paginated envelope `{ data: [...], pagination: { page, limit, total, hasMore } }` of all todos ordered by `created_at` descending with HTTP 200

4. **Given** a `DELETE /api/todos/:id` request with a valid id
   **When** the route handles it
   **Then** the todo is permanently removed from the database and the response returns HTTP 204

5. **Given** a `DELETE /api/todos/:id` request with a non-existent id
   **When** the route handles it
   **Then** the response returns HTTP 404 with body `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }`

6. **Given** a `POST /api/todos` request with an empty or missing `description`
   **When** Fastify JSON Schema validation runs
   **Then** the response returns HTTP 400 with a structured error body

7. **Given** the server is restarted
   **When** `GET /api/todos` is called
   **Then** all previously created todos are returned unchanged (FR29, NFR5)

## Tasks / Subtasks

- [x] Task 1: Install Drizzle Kit and create Drizzle config (AC: #1)
  - [x] 1.1 Confirm `drizzle-orm`, `@libsql/client`, and `drizzle-kit` are already in `backend/package.json` (they are — verify versions)
  - [x] 1.2 Create `backend/drizzle.config.ts` pointing to `src/db/schema.ts` and `drizzle/migrations/`
  - [x] 1.3 Create `backend/src/db/schema.ts` with the `todos` table definition
  - [x] 1.4 Create `backend/src/types/todo.ts` with `Todo`, `CreateTodoBody`, `UpdateTodoBody` TypeScript interfaces
  - [x] 1.5 Create `backend/src/utils/tags.ts` with `serializeTags` / `deserializeTags` helpers

- [x] Task 2: Generate and run the migration (AC: #1)
  - [x] 2.1 Run `npm run db:generate --workspace=backend` to generate the SQL migration file in `backend/drizzle/migrations/`
  - [x] 2.2 Run `npm run db:migrate --workspace=backend` to apply it against `local.db`
  - [x] 2.3 Add `db:generate` and `db:migrate` scripts to `backend/package.json`

- [x] Task 3: Implement all four API routes (AC: #2, #3, #4, #5, #6)
  - [x] 3.1 Create `backend/src/routes/todos.routes.ts` with Fastify JSON Schema validation on all routes
  - [x] 3.2 Implement `GET /api/todos` with optional `?status`, `?page`, `?limit` query params; return paginated envelope
  - [x] 3.3 Implement `POST /api/todos` — UUID via `crypto.randomUUID()`, status defaults to `draft`, returns 201
  - [x] 3.4 Implement `DELETE /api/todos/:id` — 204 on success, 404 on missing ID
  - [x] 3.5 Register `todos.routes.ts` in `backend/src/app.ts` under the `/api` prefix

- [x] Task 4: Write integration tests (AC: #2–#7)
  - [x] 4.1 Create `backend/src/__tests__/todos.routes.test.ts` using Vitest + `buildApp()`
  - [x] 4.2 Cover: POST 201, GET 200 (paginated), DELETE 204, DELETE 404, POST 400 (empty description), data persistence across `buildApp()` re-instantiation

## Dev Notes

### What Already Exists — Do Not Recreate

- `backend/src/db/connection.ts` — already exports `db` (Drizzle instance) and `client` (libsql). Import from here. **Do not create a second client.**
- `backend/src/app.ts` — `buildApp()` factory already registers CORS, error handler, and health route. **Register todo routes inside this function only.**
- `backend/src/plugins/error-handler.ts` — already serialises all unhandled errors to `{ error: { code, message } }`. You do NOT need to add error-handling boilerplate in routes — just throw or let Fastify catch.
- `drizzle-orm`, `@libsql/client`, `drizzle-kit` are already in `backend/package.json`. No install needed.

### Schema Definition

Create `backend/src/db/schema.ts` exactly as specified in architecture:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const todos = sqliteTable('todos', {
  id:          text('id').primaryKey(),
  description: text('description').notNull(),
  status:      text('status', {
                 enum: ['draft', 'ready', 'in_progress', 'backlog', 'completed']
               }).notNull().default('draft'),
  tags:        text('tags').notNull().default(''),
  createdAt:   integer('created_at', { mode: 'timestamp' })
                 .notNull()
                 .$defaultFn(() => new Date()),
  updatedAt:   integer('updated_at', { mode: 'timestamp' })
                 .notNull()
                 .$defaultFn(() => new Date()),
})
```

**Important:** `createdAt` and `updatedAt` use `{ mode: 'timestamp' }` — Drizzle handles JS `Date` ↔ integer conversion automatically.

### Drizzle Config

Create `backend/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME ?? 'file:local.db',
  },
})
```

Add to `backend/package.json` scripts:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

### Tags Utility

Create `backend/src/utils/tags.ts` — this is the **single serialization point**. No other file may read/write raw tag CSV strings.

```typescript
export function serializeTags(tags: string[]): string {
  return tags.filter(Boolean).join(',')
}

export function deserializeTags(csv: string): string[] {
  if (!csv) return []
  return csv.split(',').filter(Boolean)
}
```

### TypeScript Types

Create `backend/src/types/todo.ts`:

```typescript
export interface Todo {
  id: string
  description: string
  status: 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'
  tags: string[]
  createdAt: string   // ISO 8601 — serialised at API boundary
  updatedAt: string   // ISO 8601
}

export interface CreateTodoBody {
  description: string
  tags?: string[]
}

export interface UpdateTodoBody {
  status?: 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'
  description?: string
  tags?: string[]
}
```

**Note:** Story 2.1 only implements `POST`, `GET`, and `DELETE`. `PATCH` (UpdateTodoBody) is for Story 3.1. Define the type now to avoid rework.

### API Endpoint Details

**Route file location:** `backend/src/routes/todos.routes.ts`
**Registered in `app.ts` under prefix `/api`:**
```typescript
await app.register(todosRoutes, { prefix: '/api' })
```

#### GET /api/todos

Query params (all optional):
- `status` — one of the five enum values
- `page` — integer ≥ 1, default `1`
- `limit` — integer 1–100, default `50`

Response shape (200):
```json
{
  "data": [ /* Todo[] */ ],
  "pagination": { "page": 1, "limit": 50, "total": 3, "hasMore": false }
}
```

Order: `created_at` DESC.

**Fastify JSON Schema for query params:**
```typescript
querystring: {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['draft', 'ready', 'in_progress', 'backlog', 'completed'] },
    page:   { type: 'integer', minimum: 1, default: 1 },
    limit:  { type: 'integer', minimum: 1, maximum: 100, default: 50 },
  },
  additionalProperties: false,
}
```

#### POST /api/todos

Request body:
```json
{ "description": "Buy milk", "tags": ["work"] }
```

**Fastify JSON Schema:**
```typescript
body: {
  type: 'object',
  required: ['description'],
  properties: {
    description: { type: 'string', minLength: 1 },
    tags: { type: 'array', items: { type: 'string' }, default: [] },
  },
  additionalProperties: false,
}
```

Response (201): full `Todo` object (with `tags` as `string[]` — deserialised before return).

UUID: `crypto.randomUUID()` — built-in Node.js 20+ API, no import needed.

#### DELETE /api/todos/:id

- 204: no body
- 404: `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }` — throw a Fastify error:
  ```typescript
  throw app.httpErrors.notFound('Todo not found')
  // OR manually: reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Todo not found' } })
  ```

**Note:** `app.httpErrors` requires `@fastify/sensible`. If not installed, use `reply.code(404).send(...)` pattern matching the existing error handler shape.

### Response Serialisation Rule

All dates must be serialised to ISO 8601 strings at the API boundary — **never return a raw `Date` object or integer timestamp**:
```typescript
createdAt: todo.createdAt.toISOString(),
updatedAt: todo.updatedAt.toISOString(),
```

### Testing Pattern

Tests live in `backend/src/__tests__/todos.routes.test.ts`.

Use `buildApp()` (already exists in `app.ts`) and Fastify's `inject()` for route testing — no live HTTP server needed:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../app.js'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeEach(async () => {
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
})

it('POST /api/todos returns 201', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/todos',
    payload: { description: 'Test todo' },
  })
  expect(res.statusCode).toBe(201)
  const body = res.json()
  expect(body.id).toBeDefined()
  expect(body.status).toBe('draft')
})
```

**Test database:** Tests run against a real SQLite file (same `DB_FILE_NAME` from env). Ensure tests clean up todos they create, OR use a separate `DB_FILE_NAME=file:test.db` in a `.env.test` file — either approach is acceptable but must be consistent.

### Architecture Compliance Checklist

| Rule | Required |
|------|---------|
| JSON response fields | `camelCase` (`createdAt`, `hasMore`) |
| `tags` in responses | Always `string[]`, never raw CSV |
| Error response shape | `{ error: { code, message } }` — handled by existing error handler |
| No barrel `index.ts` files | Import directly from source |
| Test file location | `backend/src/__tests__/` with `.test.ts` suffix |
| No stack traces in responses | Existing error handler already strips them |
| `GET /api/todos` response | Wrapped in `{ data, pagination }` — NOT a bare array |

### Drizzle Query Pattern

```typescript
import { db } from '../db/connection.js'
import { todos } from '../db/schema.js'
import { eq, desc, count } from 'drizzle-orm'

// GET all todos (paginated)
const offset = (page - 1) * limit
const rows = await db.select().from(todos).orderBy(desc(todos.createdAt)).limit(limit).offset(offset)
const [{ count: total }] = await db.select({ count: count() }).from(todos)

// POST create
const [created] = await db.insert(todos).values({
  id: crypto.randomUUID(),
  description: body.description,
  tags: serializeTags(body.tags ?? []),
  status: 'draft',
}).returning()

// DELETE
const deleted = await db.delete(todos).where(eq(todos.id, params.id)).returning()
if (deleted.length === 0) { /* 404 */ }
```

### Previous Story Learnings (1.2 → 2.1)

- `backend/src/app.ts` uses `buildApp()` factory pattern — integrate todo routes here, not in `index.ts`
- Error handler plugin (`plugins/error-handler.ts`) is already registered — do not add duplicate error handling in route files
- Existing tests in `__tests__/` use `buildApp()` + `app.inject()` — follow this pattern exactly
- `connection.ts` uses `process.env.DB_FILE_NAME` — no hardcoded paths
- All imports use `.js` extension (ESM) — e.g. `import { db } from '../db/connection.js'`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Debug Log References
N/A

### Completion Notes List
- All 23 backend tests pass (4 test files: cors, health, error-handler, todos.routes)
- Schema uses `{ mode: 'number' }` integers (ms epoch) instead of `{ mode: 'timestamp' }` (s epoch) to guarantee sub-second ordering in tests and match architecture's "unix ms" spec
- `P8` (Vite function-form defineConfig) from Story 1.3 code review deferred — incompatible with Vitest `mergeConfig` typing
- `PATCH /api/todos/:id` deliberately NOT implemented — scoped to Story 3.1; `UpdateTodoBody` type pre-declared in `types/todo.ts`

### File List
- `backend/drizzle.config.ts` — NEW
- `backend/src/db/schema.ts` — NEW
- `backend/src/types/todo.ts` — NEW
- `backend/src/utils/tags.ts` — NEW
- `backend/src/routes/todos.routes.ts` — NEW
- `backend/src/app.ts` — MODIFIED (registered todosRoutes)
- `backend/package.json` — MODIFIED (added db:generate, db:migrate scripts)
- `backend/src/__tests__/todos.routes.test.ts` — NEW
- `backend/drizzle/migrations/0000_lucky_quasar.sql` — NEW (generated)

### Review Findings

- [x] [Review][Patch] P1: Double quotes + semicolons in `app.ts` violate single-quote project style [backend/src/app.ts:4,22]
- [x] [Review][Patch] P2: `STATUS_ENUM` copy-pasted in routes instead of derived from schema type [backend/src/routes/todos.routes.ts:7]
- [x] [Review][Patch] P3: Tag items accept commas in JSON schema — comma in tag value causes round-trip corruption [backend/src/routes/todos.routes.ts:87]
- [x] [Review][Patch] P4: `description` field missing `maxLength` — trivial resource-exhaustion vector [backend/src/routes/todos.routes.ts:83]
- [x] [Review][Patch] P5: Whitespace-only description (e.g. `"   "`) passes `minLength: 1` — invalid data stored [backend/src/routes/todos.routes.ts:83]
- [x] [Review][Patch] P6: Whitespace-only and empty-string tag items not rejected by JSON schema or tags utility [backend/src/routes/todos.routes.ts:87, backend/src/utils/tags.ts]
- [x] [Review][Patch] P7: `const now = new Date(); const nowMs = now.getTime()` — use `Date.now()` directly [backend/src/routes/todos.routes.ts:92-93]
- [x] [Review][Patch] P8: DELETE `params` schema missing `additionalProperties: false` — inconsistent input hardening [backend/src/routes/todos.routes.ts:117-124]
- [x] [Review][Patch] P9: `page` query param has no `maximum` — unbounded offset possible [backend/src/routes/todos.routes.ts:22]
- [x] [Review][Patch] P10: No test covering invalid `?status=bogus` → 400 — sole AJV guard is untested [backend/src/__tests__/todos.routes.test.ts]
- [x] [Review][Patch] P11: 400 tests assert only `statusCode` — AC6 error body shape unverified [backend/src/__tests__/todos.routes.test.ts:58-76]
- [x] [Review][Defer] D1: `updatedAt` frozen at insert-time — no `$onUpdate` in schema [backend/src/db/schema.ts:14-17] — deferred, pre-existing; scoped to Story 3.1 PATCH route
- [x] [Review][Defer] D2: Data query and count query are not in a transaction — inconsistent pagination under concurrent writes [backend/src/routes/todos.routes.ts:36-49] — deferred, pre-existing; SQLite single-writer mitigates; post-MVP concern
- [x] [Review][Defer] D3: Test suite operates against developer's `local.db` — no test-specific DB isolation [backend/src/__tests__/todos.routes.test.ts] — deferred, pre-existing; spec explicitly allows `beforeEach` cleanup approach
- [x] [Review][Defer] D4: No response schemas on any route — future DB column leakage risk [backend/src/routes/todos.routes.ts] — deferred, pre-existing; not required by story spec; architecture improvement
