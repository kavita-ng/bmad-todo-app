# Story 1.2: Backend Server Infrastructure

Status: done

## Story

As a developer,
I want the Fastify server configured with CORS, structured error handling, and a Drizzle database connection,
So that the backend is ready to accept requests from the frontend and write to a persistent SQLite file.

## Acceptance Criteria

1. **Given** the backend `.env` has `DB_FILE_NAME=file:local.db` **When** the server starts **Then** a `local.db` SQLite file is created in the backend directory if it does not already exist

2. **Given** the server is running and `ALLOWED_ORIGIN=http://localhost:5173` **When** the Vite dev server makes a request **Then** CORS headers permit the request; a request from any other origin is rejected with a CORS error

3. **Given** any route receives a request that triggers an unhandled error **When** the error handler processes it **Then** the response body is `{ "error": { "code": "<string>", "message": "<string>" } }` with an appropriate HTTP status code

4. **Given** the Drizzle connection module is loaded **When** the server starts **Then** the connection to SQLite is established without errors (logged to console in dev)

## Tasks / Subtasks

- [x] Task 1: Create Fastify app factory (AC: #2, #3)
  - [x] 1.1 Create `backend/src/app.ts` — async factory function `buildApp()` that creates a Fastify instance, registers plugins (CORS, error handler), and returns it
  - [x] 1.2 Update `backend/src/index.ts` to call `buildApp()`, then call `.listen()` — keeps startup logic out of testable app module

- [x] Task 2: CORS plugin (AC: #2)
  - [x] 2.1 Create `backend/src/plugins/cors.ts` — registers `@fastify/cors` with `origin` from `process.env.ALLOWED_ORIGIN`
  - [x] 2.2 Verify non-allowed origin receives a CORS rejection (covered by integration test in Task 5)

- [x] Task 3: Error handler plugin (AC: #3)
  - [x] 3.1 Create `backend/src/plugins/error-handler.ts` — sets Fastify `setErrorHandler` to always return `{ error: { code, message } }` shape
  - [x] 3.2 Handle Fastify validation errors (400), not-found (404), and generic 500 within the error handler
  - [x] 3.3 Ensure no stack traces are exposed in the response body

- [x] Task 4: Drizzle database connection (AC: #1, #4)
  - [x] 4.1 Create `backend/src/db/connection.ts` — initialises libsql client using `process.env.DB_FILE_NAME`, wraps in Drizzle
  - [x] 4.2 Confirm `local.db` is created on first server start (libsql creates the file automatically)

- [x] Task 5: Integration tests (AC: all)
  - [x] 5.1 Update `backend/src/__tests__/health.test.ts` to use the `buildApp()` factory instead of an inline server definition
  - [x] 5.2 Create `backend/src/__tests__/cors.test.ts` — test that allowed origin gets CORS headers, disallowed origin is rejected
  - [x] 5.3 Create `backend/src/__tests__/error-handler.test.ts` — test that unhandled errors return the `{ error: { code, message } }` shape with correct HTTP status
  - [x] 5.4 Run full test suite and confirm all pass

## Dev Notes

### Previous Story Learnings (from 1.1)

- `backend/src/index.ts` already exists with a minimal Fastify server (health endpoint, `host: '127.0.0.1'`, `Number(process.env.PORT) || 3000`). This file will be **refactored** — not replaced — in Task 1.2.
- `backend/package.json` has `"type": "module"` — all imports must be ESM (use `.js` extension on relative imports when building, but `tsx` handles this at dev time).
- `backend/tsconfig.json` uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` — relative imports in source must have `.js` extensions for `tsc` builds.
- `vitest.config.ts` is at `backend/vitest.config.ts` with `include: ['src/**/*.test.ts']`.
- `backend/src/__tests__/health.test.ts` already exists — it defines its own inline Fastify server. **This must be updated** in Task 5.1 to use `buildApp()` to avoid duplication and test the real app.
- `dotenv/config` side-effect import works correctly with ESM and NodeNext.
- Code review finding: `host: '127.0.0.1'` (not `0.0.0.0`) is the correct value for dev; keep this in `buildApp()`.

### `backend/src/app.ts` — App Factory Pattern

The architecture doc specifies a clean split: `index.ts` handles process startup (listen, signals), `app.ts` is the testable Fastify instance factory.

```typescript
import Fastify, { type FastifyInstance } from 'fastify'
import corsPlugin from './plugins/cors.js'
import errorHandlerPlugin from './plugins/error-handler.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  await app.register(corsPlugin)
  await app.register(errorHandlerPlugin)

  // Health endpoint (keep from Story 1.1)
  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
```

**Why this matters:** Tests can call `buildApp()` to get a fresh, fully configured instance and use `app.inject()` without binding to a port. `index.ts` is the only file that calls `.listen()`.

### Updated `backend/src/index.ts`

Replace the current inline Fastify setup with:

```typescript
import 'dotenv/config'
import { buildApp } from './app.js'

const PORT = Number(process.env.PORT) || 3000

async function start() {
  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: '127.0.0.1' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

**Note:** The callback-style `.listen()` from Story 1.1 is replaced with the `async/await` form, which is idiomatic with the `buildApp()` async factory.

### `backend/src/plugins/cors.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import fastifyCors from '@fastify/cors'

export default async function corsPlugin(app: FastifyInstance) {
  await app.register(fastifyCors, {
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  })
}
```

**Key detail:** `origin` is a string (exact match). `@fastify/cors` rejects requests from any origin not matching this value. If `ALLOWED_ORIGIN` is not set, falls back to the dev default rather than crashing.

### `backend/src/plugins/error-handler.ts`

```typescript
import type { FastifyInstance } from 'fastify'

export default async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)

    // Fastify validation errors (JSON Schema failures)
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      })
    }

    const statusCode = error.statusCode ?? 500
    return reply.status(statusCode).send({
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: statusCode < 500 ? error.message : 'An unexpected error occurred',
      },
    })
  })
}
```

**Critical constraints (from architecture enforcement):**
- Response shape is ALWAYS `{ error: { code, message } }` — no exceptions
- `code` is `SCREAMING_SNAKE_CASE`
- Never expose stack traces — use a generic 500 message for server errors
- Log the full error server-side (for debugging) but only return a sanitised message

### `backend/src/db/connection.ts`

```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.DB_FILE_NAME ?? 'file:local.db',
})

export const db = drizzle(client)
```

**How AC #1 is satisfied:** libsql's `createClient` with a `file:` URL creates the SQLite file on first connection if it does not exist. No explicit file creation code needed.

**Note:** The `db` export is used in `routes/` in Story 2.1. In this story, simply importing `connection.ts` at server startup (from `app.ts` or via a startup hook) is sufficient to verify the connection initialises without errors.

**Integrating into `app.ts`:** Import `db` in `app.ts` to trigger connection initialisation at startup:

```typescript
// In app.ts — add this import to trigger DB initialisation
import './db/connection.js'
```

This ensures the SQLite file is created when the server starts (AC #1, AC #4), and any connection errors surface immediately with a clear log message rather than at first query.

### File Naming — `.js` Extensions for NodeNext

With `"module": "NodeNext"` in `tsconfig.json`, relative imports in TypeScript source must use `.js` extensions (TypeScript resolves them to the compiled `.js` output). `tsx` handles this transparently at dev time but `tsc` requires it for the production build.

```typescript
// Correct
import { buildApp } from './app.js'
import corsPlugin from './plugins/cors.js'

// Wrong — will fail with tsc build
import { buildApp } from './app'
import corsPlugin from './plugins/cors'
```

### Testing Patterns

**Use `buildApp()` for all backend integration tests:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../app.js'
import type { FastifyInstance } from 'fastify'

describe('...', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('...', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
  })
})
```

**CORS test pattern:**

```typescript
// Allowed origin — expect CORS headers present
const res = await app.inject({
  method: 'GET',
  url: '/health',
  headers: { origin: 'http://localhost:5173' },
})
expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')

// Disallowed origin — CORS headers absent or request blocked
const blocked = await app.inject({
  method: 'GET',
  url: '/health',
  headers: { origin: 'http://evil.example.com' },
})
expect(blocked.headers['access-control-allow-origin']).toBeUndefined()
```

**Error handler test pattern:**

```typescript
// Register a test route that throws a controlled error
app.get('/test-error', async () => {
  throw Object.assign(new Error('Something broke'), { statusCode: 500 })
})

const res = await app.inject({ method: 'GET', url: '/test-error' })
expect(res.statusCode).toBe(500)
expect(JSON.parse(res.payload)).toEqual({
  error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
})
```

### Scope Boundaries — What Does NOT Belong in 1.2

| Item | Belongs to |
|---|---|
| Drizzle schema (`schema.ts`) | Story 2.1 |
| Drizzle Kit config (`drizzle.config.ts`) | Story 2.1 |
| Migration files | Story 2.1 |
| Any route handlers beyond `/health` | Story 2.1 |
| `tags.ts` utility | Story 2.1 |
| `types/todo.ts` (backend) | Story 2.1 |
| Frontend changes of any kind | Story 1.3 |

### Architecture References

- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — `app.ts`, `plugins/cors.ts`, `plugins/error-handler.ts`, `db/connection.ts` paths
- [Source: _bmad-output/planning-artifacts/architecture.md#Error response format] — `{ error: { code, message } }` shape, SCREAMING_SNAKE_CASE codes
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — CORS env var, error shape
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns (Error handling)] — no stack traces, structured logging
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — anti-patterns to avoid

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Initial `setErrorHandler` in a registered plugin was scoped to that plugin's encapsulation context — Fastify's plugin system isolates `setErrorHandler` per scope. Fixed by wrapping the plugin with `fastify-plugin` to break encapsulation and apply the handler to the root instance.
- `@fastify/cors` with a plain string `origin` option does not reflect the `access-control-allow-origin` header on simple GET requests. Fixed by switching to a callback-based `origin` function which explicitly calls `cb(null, true/false)`.
- Fastify's built-in 404 (unknown route) bypasses `setErrorHandler` — it goes through `setNotFoundHandler`. Added `setNotFoundHandler` to the error-handler plugin to cover this case.

### Completion Notes List

- Created `backend/src/app.ts` with `buildApp()` async factory. Registers CORS and error-handler plugins, mounts `/health` route. `index.ts` refactored to call `buildApp()` then `app.listen()` — clean separation of concerns.
- Created `backend/src/plugins/cors.ts` — uses `fastify-plugin` wrapper + callback-based `origin` function for reliable ACAO header reflection on allowed origins.
- Created `backend/src/plugins/error-handler.ts` — uses `fastify-plugin` wrapper. Handles: validation errors (400, `VALIDATION_ERROR`), thrown 4xx with `statusCode` (`NOT_FOUND`), generic 500 (`INTERNAL_SERVER_ERROR`, message sanitised). Also registers `setNotFoundHandler` for unknown routes.
- Created `backend/src/db/connection.ts` — libsql `createClient` with `DB_FILE_NAME` env var. Imported in `app.ts` to trigger connection and SQLite file creation at startup.
- Added `fastify-plugin` as explicit backend dependency.
- Updated `backend/src/__tests__/health.test.ts` to use `buildApp()` factory.
- Created `backend/src/__tests__/cors.test.ts` — 3 tests (allowed origin, blocked origin, OPTIONS preflight).
- Created `backend/src/__tests__/error-handler.test.ts` — 4 tests (500 shape, no message leak, 404 shape, unknown route shape).
- All 10 tests pass. Live server verified: `GET /health` → `{"status":"ok"}`, `GET /does-not-exist` → `{"error":{"code":"NOT_FOUND","message":"Route not found"}}`.

### File List

- `backend/src/app.ts` (created)
- `backend/src/index.ts` (modified — refactored to use `buildApp()` factory)
- `backend/src/plugins/cors.ts` (created)
- `backend/src/plugins/error-handler.ts` (created)
- `backend/src/db/connection.ts` (created)
- `backend/src/__tests__/health.test.ts` (modified — updated to use `buildApp()`)
- `backend/src/__tests__/cors.test.ts` (created)
- `backend/src/__tests__/error-handler.test.ts` (created)
- `backend/package.json` (modified — added `fastify-plugin` dependency)

### Review Findings

- [x] [Review][Patch] Unhandled Promise Rejections on startup [index.ts]
- [x] [Review][Patch] DB Connection Validation Missing and violates AC 4 [connection.ts, app.ts]
- [x] [Review][Patch] PORT environment variable NaN bug [index.ts]
- [x] [Review][Patch] Unhandled edge cases in error properties [error-handler.ts]
- [x] [Review][Defer] Add graceful shutdown handlers (SIGTERM/SIGINT) — deferred, pre-existing
- [x] [Review][Defer] Implement strict ENV variable validation (e.g. Zod) — deferred, pre-existing
- [x] [Review][Defer] Expand /health endpoint to check DB connectivity — deferred, pre-existing
