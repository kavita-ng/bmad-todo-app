
## Deferred from: code review 1-2-backend-server-infrastructure (2026-04-22)

- Add graceful shutdown handlers (SIGTERM/SIGINT)
- Implement strict ENV variable validation (e.g. Zod)
- Expand /health endpoint to check DB connectivity

## Deferred from: code review of 2-1-database-schema-and-todo-api (2026-04-22)

- D1: `updatedAt` frozen at insert-time — no `$onUpdate` in `backend/src/db/schema.ts`; must be set explicitly on every PATCH/PUT handler (Story 3.1)
- D2: Data query and count query in `GET /api/todos` are not wrapped in a transaction — inconsistent pagination under concurrent writes; SQLite single-writer mitigates for now; revisit for production scaling
- D3: Test suite operates against developer's `local.db` — no test-specific DB isolation; spec allows `beforeEach` cleanup; should introduce `DB_FILE_NAME=file:test.db` env for CI isolation
- D4: No Fastify response schemas on any route — future DB column additions will leak verbatim to API clients; add response schemas for proper serialization control and documentation

## Deferred from: code review of 2-2-todo-list-view-with-empty-loading-and-error-states (2026-04-22)

- D1: `TodoItem.vue` — `new Date(iso)` on a malformed ISO string silently renders "Invalid Date" without throwing; pre-existing, backend-controlled (backend always returns valid ISO 8601 strings)

## Deferred from: code review of 2-4-delete-todo (2026-04-22)

- D1: Concurrent deletes — `variables` from `useMutation` only tracks the last invocation; if two deletes are triggered before the first settles, only the last-triggered todo shows `isDeleting: true`; pre-existing TanStack Query v5 `variables` limitation

## Deferred from: code review of 3-1-status-update-api (2026-04-23)

- D1: SELECT→UPDATE gap in PATCH handler — if a todo is deleted between the pre-check SELECT and the UPDATE, the `.returning()` array will be empty and `updated.id` will throw; SQLite single-writer model eliminates the race in practice; revisit for any future DB with concurrent writers

## Deferred from: code review of 4-1-responsive-layout (2026-04-23)

- D1: `box-sizing: border-box` in `main.css` — redundant with Tailwind v4 built-in CSS reset; harmless but noisy; remove in a future CSS cleanup pass
- D2: `role="list"` on tags `<ul>` — 4.1 code review added it for VoiceOver/Safari semantics (Tailwind reset removes list-style), but `eslint-plugin-vuejs-accessibility` `no-redundant-roles` rule flags it; removed in Story 4.2 lint pass. The VoiceOver concern remains unresolved; revisit if a workaround (e.g. CSS `list-style: disc` re-applied) becomes viable

## Deferred from: code review of 4-2-keyboard-navigation-and-screen-reader-support (2026-04-23)

- D1: `<time>` element placed after delete button in `TodoItem.vue` action row — screen reader reads timestamp after the destructive action control; unconventional reading order but not a WCAG violation; UX refinement candidate post-Epic 4

## Deferred from: code review of 4-3-performance-validation (2026-04-23)

- D1: Formatter introduced double quotes + semicolons in `backend/src/plugins/error-handler.ts`, inconsistent with the rest of the backend codebase (all other files use single quotes, no trailing semicolons); backend has no Prettier config — fix by adding Prettier to backend devDependencies and running it over all `.ts` files in a dedicated style/tooling story
- D2: `error.message ?? 'An unexpected error occurred'` on line 24 of `error-handler.ts` is dead code — `FastifyError.message` is typed as `string` (never `undefined`), so the `??` branch is unreachable; pre-existing before this story, now statically visible due to the `FastifyError` type annotation; remove `??` fallback in a future cleanup
