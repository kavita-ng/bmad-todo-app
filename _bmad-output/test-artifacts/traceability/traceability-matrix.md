---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-gaps', 'step-05-gate-decision']
lastStep: 'step-05-gate-decision'
lastSaved: '2026-04-23'
coverageBasis: 'acceptance_criteria'
oracleResolutionMode: 'formal_requirements'
oracleConfidence: 'high'
oracleSources:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/implementation-artifacts/sprint-status.yaml'
externalPointerStatus: 'not_used'
---

# Traceability Matrix — bmad-todo-app

**Generated:** 2026-04-23  
**Oracle:** Formal acceptance criteria (Epics 1–5)  
**Oracle Confidence:** High — all stories have explicit BDD acceptance criteria  
**Test Collection Status:** COLLECTED — all test files read from source

---

## Phase 1: Coverage Oracle Resolution

### Oracle Selected

- **Type:** Formal requirements — story/epic acceptance criteria from `_bmad-output/planning-artifacts/epics.md`
- **Resolution mode:** `formal_requirements`
- **Confidence:** `high`

All 5 epics have complete story definitions with BDD-style acceptance criteria. No external pointer resolution required. No synthetic inference needed.

---

## Phase 1: Test Inventory

### Test Files Discovered (9 files, 59 tests)

| File | Level | Tests |
|------|-------|-------|
| `backend/src/__tests__/health.test.ts` | API | 3 |
| `backend/src/__tests__/cors.test.ts` | API | 3 |
| `backend/src/__tests__/error-handler.test.ts` | API | 4 |
| `backend/src/__tests__/todos.routes.test.ts` | API/Integration | 19 |
| `frontend/src/components/__tests__/StatusBadge.test.ts` | Component | 10 |
| `frontend/src/components/__tests__/TodoForm.test.ts` | Component | 4 |
| `frontend/src/components/__tests__/TodoItem.test.ts` | Component | 10 |
| `frontend/src/components/__tests__/TodoList.test.ts` | Component | 5 |
| `frontend/src/components/__tests__/HelloWorld.spec.ts` | Component | 1 |
| **Total** | | **59** |

All 59 tests pass. 0 skipped. 0 pending. 0 fixme.

### Tests by Level

| Level | Count | Files |
|-------|-------|-------|
| API / Integration | 29 | health, cors, error-handler, todos.routes |
| Component | 30 | StatusBadge, TodoForm, TodoItem, TodoList, HelloWorld |
| E2E | 0 | — |
| Unit (pure logic) | 0 | — |

---

## Phase 1: Acceptance Criteria → Test Map

### Epic 1: Project Foundation

| AC | Requirement | Tests | Coverage | Priority |
|----|-------------|-------|----------|----------|
| E1-AC1 | GET /health returns `{ status: "ok" }` with HTTP 200 | health.test.ts: "returns HTTP 200", "returns { status: 'ok' }", "returns JSON content-type" | **FULL** | P1 |
| E1-AC2 | CORS allows configured origin, blocks others | cors.test.ts: all 3 tests | **FULL** | P1 |
| E1-AC3 | Frontend dev server starts (Vite + Vue 3) | HelloWorld.spec.ts (smoke mount) | **PARTIAL** — no router/app mount test | P2 |
| E1-AC4 | TypeScript compiles without errors (build) | Verified via Story 4.3 `npm run build` — no test | **NONE** (validated by CI build, not test) | P2 |

### Epic 2: Core Todo Operations

| AC | Requirement | Tests | Coverage | Priority |
|----|-------------|-------|----------|----------|
| E2-AC1 | POST /api/todos creates todo (201 + body shape) | todos.routes: "returns 201 with created todo", "returns 201 with tags" | **FULL** | P0 |
| E2-AC2 | POST /api/todos validates required description (400) | todos.routes: "returns 400 when description is missing", "returns 400 when description is empty string" | **FULL** | P0 |
| E2-AC3 | GET /api/todos returns paginated envelope | todos.routes: "returns 200 with paginated envelope", "paginates results correctly", "returns empty data array" | **FULL** | P0 |
| E2-AC4 | GET /api/todos filters by status | todos.routes: "filters by status", "returns 400 for invalid status query param" | **FULL** | P1 |
| E2-AC5 | GET /api/todos returns todos ordered descending by createdAt | todos.routes: "returns todos ordered by createdAt descending" | **FULL** | P1 |
| E2-AC6 | GET /api/todos tags deserialised as string[] | todos.routes: "deserialises tags to string[]" | **FULL** | P1 |
| E2-AC7 | TodoList renders loading/empty/error states | TodoList.test.ts: all 5 tests (loading, error, empty, list, props) | **FULL** | P1 |
| E2-AC8 | TodoForm validates empty description client-side | TodoForm.test.ts: "shows validation error and blocks submission when input is empty" | **FULL** | P1 |
| E2-AC9 | TodoForm calls onSubmit with trimmed value and clears input | TodoForm.test.ts: "calls onSubmit with trimmed description and clears input" | **FULL** | P1 |
| E2-AC10 | TodoForm input restored when API error arrives after submit | TodoForm.test.ts: "restores input when error prop changes to truthy after submit" | **FULL** | P1 |
| E2-AC11 | Data persists across app restart (SQLite) | todos.routes: "todos survive app close and reopen" | **FULL** | P1 |

### Epic 3: Status Workflow

| AC | Requirement | Tests | Coverage | Priority |
|----|-------------|-------|----------|----------|
| E3-AC1 | PATCH /api/todos/:id updates status (200 + body shape) | todos.routes: "returns 200 with updated todo when status is valid" | **FULL** | P0 |
| E3-AC2 | PATCH sets updatedAt > createdAt | todos.routes: "updatedAt is greater than createdAt after update" | **FULL** | P0 |
| E3-AC3 | PATCH validates invalid status (400) | todos.routes: "returns 400 when status value is invalid" | **FULL** | P0 |
| E3-AC4 | PATCH validates missing status field (400) | todos.routes: "returns 400 when status field is missing" | **FULL** | P0 |
| E3-AC5 | PATCH returns 404 for unknown todo id | todos.routes: "returns 404 for unknown todo id" (confirmed in routes) | **FULL** | P0 |
| E3-AC6 | StatusBadge renders all 5 status labels correctly | StatusBadge.test.ts: 5 `it.each` label tests | **FULL** | P1 |
| E3-AC7 | StatusBadge applies font-medium for active statuses | StatusBadge.test.ts: 3 active-case tests | **FULL** | P1 |
| E3-AC8 | StatusBadge applies font-normal for terminal statuses | StatusBadge.test.ts: 2 terminal-case tests | **FULL** | P1 |
| E3-AC9 | TodoItem renders status select with 5 options | TodoItem.test.ts: "renders a select with 5 status options" | **FULL** | P1 |
| E3-AC10 | TodoItem calls onStatusChange when select changes | TodoItem.test.ts: "calls onStatusChange when select changes" | **FULL** | P1 |
| E3-AC11 | TodoItem disables select when isUpdatingStatus | TodoItem.test.ts: "disables select when isUpdatingStatus is true" | **FULL** | P1 |

### Epic 4: Responsive, Accessible, Production-Ready

| AC | Requirement | Tests | Coverage | Priority |
|----|-------------|-------|----------|----------|
| E4-AC1 | All interactive elements ≥ 44×44px touch targets | No automated test | **NONE** | P2 |
| E4-AC2 | Layout uses responsive Tailwind classes (sm: breakpoints) | No automated test | **NONE** | P2 |
| E4-AC3 | TodoItem: tab order description → status select → delete | No automated test | **NONE** | P2 |
| E4-AC4 | TodoItem: focus-visible rings on select and delete button | No automated test | **NONE** | P2 |
| E4-AC5 | TodoForm: focus-visible ring on submit button | No automated test | **NONE** | P2 |
| E4-AC6 | ARIA live region announces create/delete/status mutations | No automated test | **NONE** | P2 |
| E4-AC7 | `<html lang="en">` set in index.html | No automated test | **NONE** | P2 |
| E4-AC8 | Page interactive within 3s (NFR2) | No automated test (build size validated manually in Story 4.3) | **NONE** | P1 |
| E4-AC9 | Optimistic update within 16ms/1 frame (NFR1) | No automated test (code-path verified in Story 4.3) | **NONE** | P1 |
| E4-AC10 | 50+ items no jank (NFR3) | No automated test (structural: pagination caps at 50) | **NONE** | P1 |
| E4-AC11 | Production build succeeds with no errors | Verified manually in Story 4.3 `npm run build` | **NONE** (manual, not automated) | P1 |

### Epic 5: Developer Documentation

| AC | Requirement | Tests | Coverage | Priority |
|----|-------------|-------|----------|----------|
| E5-AC1 | README conveys purpose/persona/features | No automated test | **NONE** | P3 |
| E5-AC2 | README Prerequisites section (Node ≥ 20.19.0) | No automated test | **NONE** | P3 |
| E5-AC3 | README Local Setup — 5 steps, correct commands | No automated test | **NONE** | P3 |
| E5-AC4 | README Available Scripts section | No automated test | **NONE** | P3 |
| E5-AC5 | README Project Structure section | No automated test | **NONE** | P3 |
| E5-AC6 | README Further Reading links exist | No automated test (file existence verified manually) | **NONE** | P3 |

---

## Phase 1: Coverage Heuristics

### API Endpoint Coverage

| Endpoint | Tested | Tests |
|----------|--------|-------|
| GET /health | ✅ | health.test.ts |
| GET /api/todos | ✅ | todos.routes.test.ts |
| POST /api/todos | ✅ | todos.routes.test.ts |
| DELETE /api/todos/:id | ✅ | todos.routes.test.ts |
| PATCH /api/todos/:id | ✅ | todos.routes.test.ts |

**All 5 API endpoints have direct test coverage.** No endpoint gaps.

### Error-Path Coverage

| Error Scenario | Status |
|----------------|--------|
| POST: missing description (400) | ✅ Covered |
| POST: empty description (400) | ✅ Covered |
| GET: invalid status filter (400) | ✅ Covered |
| DELETE: unknown ID (404) | ✅ Covered |
| PATCH: invalid status value (400) | ✅ Covered |
| PATCH: missing status field (400) | ✅ Covered |
| PATCH: unknown ID (404) | ✅ Covered |
| Unknown route (404 via setNotFoundHandler) | ✅ Covered |
| 500 error shape / no leak | ✅ Covered |
| TodoForm: empty submit blocked client-side | ✅ Covered |
| TodoForm: input restored on API error | ✅ Covered |

**Excellent error-path coverage at API and component level.**

### Auth / AuthZ Coverage

No authentication or authorization is in scope for this app (no login, no sessions, no roles). **N/A — not applicable.**

### UI Journey Coverage (E2E gap)

| Journey | Component Coverage | E2E Coverage |
|---------|-------------------|--------------|
| View todo list (loading/empty/populated) | ✅ TodoList.test.ts | ❌ None |
| Create a todo | ✅ TodoForm.test.ts | ❌ None |
| Delete a todo | ✅ TodoItem.test.ts | ❌ None |
| Change todo status | ✅ TodoItem.test.ts | ❌ None |
| Optimistic update + rollback on error | ❌ None | ❌ None |
| ARIA live announcement (a11y) | ❌ None | ❌ None |
| Responsive layout (viewport switching) | ❌ None | ❌ None |
| Full round-trip (frontend → API → DB) | ❌ None | ❌ None |

**Zero E2E tests exist.** All user journey coverage is at the component level with mocked props — no integration between frontend and running backend is tested.

### UI State Coverage

| State | Component Test | Notes |
|-------|---------------|-------|
| Loading state | ✅ TodoList: isPending=true | |
| Error state | ✅ TodoList: isError=true | |
| Empty state | ✅ TodoList: todos=[] | |
| Populated list | ✅ TodoList: todos=[…] | |
| Pending delete (button disabled) | ✅ TodoItem: isDeleting=true | |
| Pending status change (select disabled) | ✅ TodoItem: isUpdatingStatus=true | |
| Form pending (button disabled) | ✅ TodoForm: isPending=true | |
| Form error restore | ✅ TodoForm: error prop | |

**Good UI state coverage in component tests.**

---

## Phase 1: Gap Analysis

### P0 Gaps — CRITICAL

**None.** All P0 acceptance criteria (create, read, delete, status update CRUD operations + validation) have full API-level test coverage.

### P1 Gaps

| Gap ID | Requirement | Gap Type | Risk |
|--------|-------------|----------|------|
| G-P1-01 | E4-AC8: Page interactive within 3s | NONE — no automated performance test | Medium — manually validated in Story 4.3; no regression guard |
| G-P1-02 | E4-AC9: Optimistic update ≤ 16ms | NONE — no automated timing test | Medium — code-path correct but no regression guard |
| G-P1-03 | E4-AC10: 50+ items no jank | NONE — structural guarantee via pagination | Low — pagination enforces this structurally |
| G-P1-04 | E4-AC11: Production build succeeds | NONE — no automated build-gate test | Medium — should be CI step, not manual |
| G-P1-05 | Full frontend→backend integration (round-trip) | NONE — no E2E / MSW integration tests | Medium — component tests mock everything; real API not exercised |

### P2 Gaps

| Gap ID | Requirement | Gap Type | Risk |
|--------|-------------|----------|------|
| G-P2-01 | E4-AC1–7: Responsive layout + a11y attributes | NONE — no visual regression or a11y automation | Low-Medium — implemented and manually verified; no guardrail |
| G-P2-02 | E1-AC3: Frontend app-level boot test | PARTIAL — HelloWorld mounts but no HomeView/router test | Low |
| G-P2-03 | E1-AC4: TypeScript compile (build) | NONE — no CI job | Low-Medium — currently manual |

### P3 Gaps

All Epic 5 (README) ACs are P3 and have no automated tests — this is expected and acceptable for documentation.

### Recommendations

| # | Priority | Recommendation | Effort |
|---|----------|---------------|--------|
| R-01 | P1 | **Add E2E test layer** using Playwright. One smoke test: create a todo, change status, delete it — verifying the full frontend→API→DB round-trip. This is the highest-value missing coverage. | Medium |
| R-02 | P1 | **Add build gate to CI** — `npm run build` should be a required CI step. Currently only run manually. | Low |
| R-03 | P1 | **Add optimistic-update integration test** using MSW (Mock Service Worker) in Vitest — mount `HomeView` with a mocked API and assert UI state before and after mutation settles. Captures NFR1 regression risk. | Medium |
| R-04 | P2 | **Add axe-core accessibility assertion** to TodoItem and HomeView component tests — catches ARIA/label regressions without E2E. | Low |
| R-05 | P2 | **Add HomeView mount test** with Vue Router and QueryClientProvider to verify app boots and renders TodoList. | Low |

---

## Phase 2: Gate Decision

### Coverage Statistics

| Priority | Total ACs | Covered | Partial | None | Coverage % |
|----------|-----------|---------|---------|------|-----------|
| P0 | 8 | 8 | 0 | 0 | **100%** |
| P1 | 19 | 14 | 0 | 5 | **74%** |
| P2 | 8 | 0 | 1 | 7 | **6%** |
| P3 | 6 | 0 | 0 | 6 | **0%** |
| **Overall** | **41** | **22** | **1** | **18** | **54%** |

### Gate Decision Logic Applied

```
P0 coverage: 100% → no critical blockers
P1 coverage: 74% → below 100% but all P1 gaps are:
  - Performance NFRs (3): structurally satisfied, no regression risk identified
  - Build gate: manual pass verified Story 4.3
  - Round-trip E2E: not present — real gap, but no current failure evidence
Critical gaps count: 0
Oracle confidence: high
Active test cases: 59
```

### ⚠️ GATE DECISION: CONCERNS

**Not a FAIL — P0 is 100% covered and no blockers exist. Not a clean PASS — three P1 gaps carry meaningful regression risk.**

| Signal | Value | Implication |
|--------|-------|-------------|
| P0 coverage | 100% | ✅ All destructive/mutating operations tested |
| P1 critical paths | 74% | ⚠️ 5 P1 items have no automated guard |
| E2E coverage | 0% | ⚠️ No frontend→backend integration test |
| Error path coverage | Excellent | ✅ All validation and error shapes tested |
| Flakiness | None detected | ✅ All 59 pass cleanly |

### Risk Score Summary

| Risk | P | I | Score | Category |
|------|---|---|-------|----------|
| No E2E — regression in API wiring undetected | 2 | 2 | **4** | MONITOR |
| No build CI gate — build regression undetected | 2 | 2 | **4** | MONITOR |
| No a11y automation — Epic 4 regressions undetected | 2 | 1 | **2** | DOCUMENT |
| No optimistic-update test — NFR1 regression | 1 | 2 | **2** | DOCUMENT |

No score ≥ 6. No BLOCK conditions. Gate status: **CONCERNS**.

### Waiver Recommendation

The P1 E2E gap (G-P1-05) and build gate gap (G-P1-04) should be addressed in a follow-on **Epic 6: Quality Automation** before this project is used in a production or shared context. As a reference implementation / learning project, the current test suite is fit for purpose at this stage.

---

## Summary

🧪 **Murat's Assessment — CONCERNS (not a blocker)**

> The P0 foundation is solid. All CRUD operations and their validation paths are fully tested at the API level. Component tests cover every UI state. No flakiness. The gaps are real but not blockers for a reference implementation: zero E2E tests mean a front-to-back regression could slip through undetected, and the build isn't gated in CI. These are the two highest-priority items for a follow-on quality story.
>
> **Verdict: Ship it — but plan Epic 6.**

### Top 3 Actions

1. **R-01 (P1):** Add one Playwright E2E smoke test — create → status change → delete
2. **R-02 (P1):** Add `npm run build` as a required CI step
3. **R-04 (P2):** Add axe-core assertion to TodoItem — low effort, high signal for a11y regressions
