# Story 3.1: Status Update API

Status: done

## Story

As a developer,
I want a `PATCH /api/todos/:id` endpoint that validates and persists status changes,
So that the frontend can update any todo's status to any of the five valid states.

## Acceptance Criteria

1. **Given** a `PATCH /api/todos/:id` request with body `{ "status": "in_progress" }`
   **When** the route handles it
   **Then** the todo's `status` is updated in the database, `updated_at` is refreshed, and the full updated todo is returned with HTTP 200

2. **Given** a `PATCH /api/todos/:id` request with an invalid status value (e.g. `{ "status": "done" }`)
   **When** Fastify JSON Schema validation runs
   **Then** the response returns HTTP 400 with a structured error body — only `draft`, `ready`, `in_progress`, `backlog`, `completed` are accepted (FR5)

3. **Given** a `PATCH /api/todos/:id` request with a non-existent id
   **When** the route handles it
   **Then** the response returns HTTP 404 with body `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }`

4. **Given** a todo has its status updated
   **When** the server is restarted and `GET /api/todos` is called
   **Then** the updated status is returned correctly (NFR5)

## Tasks / Subtasks

- [x] Task 1: Add `PatchTodoBody` type to `backend/src/types/todo.ts` (AC: #1, #2)
  - [x] 1.1 Export `PatchTodoBody` interface with a single required field `status: TodoStatus`

- [x] Task 2: Add `PATCH /api/todos/:id` route to `backend/src/routes/todos.routes.ts` (AC: #1, #2, #3, #4)
  - [x] 2.1 Add route after the existing DELETE handler
  - [x] 2.2 Params schema: `{ id: string }` — same as DELETE
  - [x] 2.3 Body schema: `{ status: { type: "string", enum: STATUS_ENUM } }` — required, no additional properties
  - [x] 2.4 Handler: query DB for existing todo; if not found return 404 with `{ error: { code: "NOT_FOUND", message: "Todo not found" } }`
  - [x] 2.5 Handler: update `status` and `updatedAt = Date.now()` with Drizzle `.update().set().where().returning()`
  - [x] 2.6 Return HTTP 200 with the full serialized todo (same shape as POST: id, description, status, tags deserialized, createdAt/updatedAt as ISO strings)

- [x] Task 3: Write tests in `backend/src/__tests__/todos.routes.test.ts` (AC: #1, #2, #3)
  - [x] 3.1 `PATCH /api/todos/:id` — returns 200 with updated todo when status is valid
  - [x] 3.2 `PATCH /api/todos/:id` — `updatedAt` is greater than `createdAt` after update (proves timestamp refreshed)
  - [x] 3.3 `PATCH /api/todos/:id` — returns 400 when `status` value is invalid (e.g. `"done"`)
  - [x] 3.4 `PATCH /api/todos/:id` — returns 400 when `status` field is missing from body
  - [x] 3.5 `PATCH /api/todos/:id` — returns 404 when id does not exist

## Dev Notes

### What Already Exists — Do Not Recreate

- `backend/src/routes/todos.routes.ts` — already has GET, POST, DELETE handlers. **Add PATCH here only.** Do NOT create a new file.
- `backend/src/db/schema.ts` — `todos` table already has `updatedAt: integer('updated_at')` column. **No schema migration needed.** The `$defaultFn` only runs on insert; you must set `updatedAt` explicitly in the PATCH handler.
- `backend/src/types/todo.ts` — already has `TodoStatus`, `Todo`, `CreateTodoBody`, `UpdateTodoBody`. `UpdateTodoBody` has optional `status?: TodoStatus` but is a generic update body. Add a focused `PatchTodoBody` type with **required** `status` (the PATCH endpoint for this story only allows status changes).
- `backend/src/__tests__/todos.routes.test.ts` — already has 24 tests for GET/POST/DELETE; `beforeEach` does `db.delete(todos)` + `buildApp()`. **Add a new `describe('PATCH /api/todos/:id', ...)` block.**
- `STATUS_ENUM` — already declared as `const STATUS_ENUM = todos.status.enumValues` at the top of `todos.routes.ts`. Use it directly in the body schema.

### PATCH Route Implementation

Add after the DELETE handler in `todos.routes.ts`:

```typescript
// PATCH /api/todos/:id
app.patch(
  "/todos/:id",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
        additionalProperties: false,
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: STATUS_ENUM },
        },
        additionalProperties: false,
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as PatchTodoBody

    const existing = await db.select().from(todos).where(eq(todos.id, id)).limit(1)

    if (existing.length === 0) {
      return reply.code(404).send({
        error: { code: "NOT_FOUND", message: "Todo not found" },
      })
    }

    const [updated] = await db
      .update(todos)
      .set({ status, updatedAt: Date.now() })
      .where(eq(todos.id, id))
      .returning()

    return {
      id: updated.id,
      description: updated.description,
      status: updated.status,
      tags: deserializeTags(updated.tags),
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    }
  },
)
```

**Key implementation notes:**
- `updatedAt: Date.now()` must be set explicitly in `.set()` — `$defaultFn` only fires on INSERT, not UPDATE (this is a known deferred issue from Story 2.1)
- `existing` check before update avoids a `.returning()` returning empty array without a clear 404 path — check first, update second
- `status` in the response will be the new value since we use `.returning()` after `.set()`
- Import `PatchTodoBody` from `'../types/todo.js'` — add it to the existing import at the top of the routes file

### `PatchTodoBody` Type

Add to `backend/src/types/todo.ts`:

```typescript
export interface PatchTodoBody {
  status: TodoStatus
}
```

Note: `UpdateTodoBody` already exists with optional fields for future use; `PatchTodoBody` is the stricter per-story type for this endpoint.

### Import Update in `todos.routes.ts`

Current import line:

```typescript
import type { CreateTodoBody } from '../types/todo.js'
```

Update to:

```typescript
import type { CreateTodoBody, PatchTodoBody } from '../types/todo.js'
```

### Response Shape

The PATCH response must match the existing Todo shape (same as POST 201 response):

```json
{
  "id": "uuid",
  "description": "Buy milk",
  "status": "in_progress",
  "tags": [],
  "createdAt": "2026-04-23T10:00:00.000Z",
  "updatedAt": "2026-04-23T10:05:00.000Z"
}
```

`updatedAt` must be strictly greater than `createdAt` after a successful PATCH — this is testable and proves the timestamp was refreshed (see test 3.2).

### Test Block Pattern

Add a new `describe` block to `todos.routes.test.ts`. Follow the existing pattern exactly — `app.inject()` with `method`, `url`, `payload`:

```typescript
describe('PATCH /api/todos/:id', () => {
  it('returns 200 with updated todo when status is valid', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Test todo' },
    })
    const { id } = created.json()

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { status: 'in_progress' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(id)
    expect(body.status).toBe('in_progress')
    expect(body.description).toBe('Test todo')
    expect(body.createdAt).toBeDefined()
    expect(body.updatedAt).toBeDefined()
  })

  it('updatedAt is greater than createdAt after update', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Timestamp test' },
    })
    const { id, createdAt } = created.json()

    // Small sleep to ensure time has advanced
    await new Promise((r) => setTimeout(r, 5))

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { status: 'ready' },
    })

    expect(res.statusCode).toBe(200)
    const { updatedAt } = res.json()
    expect(new Date(updatedAt).getTime()).toBeGreaterThan(new Date(createdAt).getTime())
  })

  it('returns 400 when status value is invalid', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Test todo' },
    })
    const { id } = created.json()

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { status: 'done' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when status field is missing', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { description: 'Test todo' },
    })
    const { id } = created.json()

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when id does not exist', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/todos/nonexistent-id',
      payload: { status: 'ready' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })
})
```

### Error Handler Behaviour

The existing `errorHandlerPlugin` in `backend/src/plugins/error-handler.ts` already converts Fastify validation errors (schema rejections) to `{ error: { code: "VALIDATION_ERROR", message: "..." } }` with status 400. **No changes needed to the error handler.** The PATCH body schema will automatically produce the right 400 error for invalid or missing `status`.

### Architecture Compliance

| Rule | Compliance |
|------|-----------|
| No barrel `index.ts` | Import directly from source files |
| Error shape `{ error: { code, message } }` | 404 uses this shape; 400 via error handler plugin |
| Timestamps as unix milliseconds in DB | `Date.now()` for `updatedAt` in `.set()` |
| Response dates as ISO 8601 | `new Date(updated.updatedAt).toISOString()` |
| Tags deserialized | `deserializeTags(updated.tags)` in response |
| `STATUS_ENUM` from schema | Already at top of routes file — reuse in body schema |
| Tests co-located in `__tests__/` | New `describe` block in existing `todos.routes.test.ts` |
| Test isolation | Existing `beforeEach` does `db.delete(todos)` — no changes needed |

### Known Deferred Issues Resolved by This Story

- **Story 2.1 D1**: `updatedAt` was frozen at insert time because `$defaultFn` doesn't fire on UPDATE. This story **explicitly sets `updatedAt: Date.now()`** in the PATCH handler, resolving this for status updates. Test 3.2 (`updatedAt > createdAt`) verifies it.

### Backend API Contract After Story 3.1

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/todos` | `?status&page&limit` | 200 `{ data, pagination }` |
| POST | `/api/todos` | `{ description, tags? }` | 201 `Todo` |
| DELETE | `/api/todos/:id` | — | 204 / 404 |
| **PATCH** | **`/api/todos/:id`** | **`{ status }`** | **200 `Todo` / 400 / 404** |

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Debug Log References
n/a

### Completion Notes List
- All 3 tasks implemented in a single pass; 29 backend tests passing (24 existing + 5 new PATCH tests)
- `updatedAt: Date.now()` set explicitly in `.set()` — resolves deferred issue 2.1 D1; test 3.2 (`updatedAt > createdAt`) verifies it
- `existing` pre-check before update gives clean 404 path without relying on empty `.returning()` array
- `STATUS_ENUM` reused from top of routes file — no duplication

### File List
- `backend/src/types/todo.ts` — added `PatchTodoBody` interface
- `backend/src/routes/todos.routes.ts` — added `PATCH /api/todos/:id` handler; updated import
- `backend/src/__tests__/todos.routes.test.ts` — added `describe('PATCH /api/todos/:id', ...)` with 5 tests

## Review Findings

- [x] [Review][Patch] P1: Mixed quote style in routes file — PATCH handler and its import use double quotes while surrounding GET/POST/DELETE handlers use single quotes [backend/src/routes/todos.routes.ts]
- [x] [Review][Defer] D1: SELECT→UPDATE gap — if a todo is deleted between the pre-check SELECT and the UPDATE, `updated` from `.returning()` could be undefined; `updated.id` would throw; SQLite single-writer eliminates the race in practice — deferred, pre-existing architecture constraint
