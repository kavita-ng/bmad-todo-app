
## Deferred from: code review 1-2-backend-server-infrastructure (2026-04-22)

- Add graceful shutdown handlers (SIGTERM/SIGINT)
- Implement strict ENV variable validation (e.g. Zod)
- Expand /health endpoint to check DB connectivity

## Deferred from: code review of 2-1-database-schema-and-todo-api (2026-04-22)

- D1: `updatedAt` frozen at insert-time — no `$onUpdate` in `backend/src/db/schema.ts`; must be set explicitly on every PATCH/PUT handler (Story 3.1)
- D2: Data query and count query in `GET /api/todos` are not wrapped in a transaction — inconsistent pagination under concurrent writes; SQLite single-writer mitigates for now; revisit for production scaling
- D3: Test suite operates against developer's `local.db` — no test-specific DB isolation; spec allows `beforeEach` cleanup; should introduce `DB_FILE_NAME=file:test.db` env for CI isolation
- D4: No Fastify response schemas on any route — future DB column additions will leak verbatim to API clients; add response schemas for proper serialization control and documentation
