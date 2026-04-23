# Story 4.2: Keyboard Navigation and Screen Reader Support

Status: done

## Story

As Alex,
I want to operate the entire app using only a keyboard and have all content accessible to screen readers,
So that the app meets WCAG 2.1 AA and is inclusive to all users.

## Acceptance Criteria

1. **Given** a keyboard-only user tabs through the page
   **When** they reach every interactive element (add input, submit button, status selector, delete button)
   **Then** each element receives a visible focus indicator and is operable via keyboard (Enter/Space) (NFR9)

2. **Given** a screen reader user navigates the todo list
   **When** they move through list items
   **Then** each item announces its description, status, and available actions in a meaningful order (NFR11)

3. **Given** a status change or delete is performed via keyboard
   **When** the action completes (or fails)
   **Then** the result (success or error) is communicated to screen reader users via an ARIA live region or focus management (NFR8)

4. **Given** error and empty states are displayed
   **When** inspected by a screen reader
   **Then** the messages are announced and the context is clear (NFR8)

5. **Given** `npm run lint` is executed on all `.vue` components
   **When** linting completes
   **Then** zero `eslint-plugin-vuejs-accessibility` errors are reported (NFR8)

## Tasks / Subtasks

- [ ] Task 1: Fix `lang` attribute on `<html>` in `frontend/index.html` (AC: #2, #4)
  - [ ] 1.1 Change `<html lang="">` to `<html lang="en">` — empty lang attribute is invalid; screen readers use this to select the correct speech synthesis voice

- [ ] Task 2: Add `focus-visible` ring to submit button in `frontend/src/components/TodoForm.vue` (AC: #1)
  - [ ] 2.1 Append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` to the submit button's `class` — input already has a focus ring from Story 4.1; button was missing one

- [ ] Task 3: Restructure `frontend/src/components/TodoItem.vue` for correct tab order + focus rings (AC: #1, #2)
  - [ ] 3.1 Remove the outer two-row flex structure (`<div class="flex items-start justify-between gap-3">` wrapping description+delete). Replace the root template with a simpler two-section layout:
    - Row 1: `<p>` with description (full width)
    - Row 2: `<div class="flex flex-wrap items-center gap-2">` containing StatusBadge → select → delete button → time (in that DOM order)
    - The delete button moves from row 1 (top-right) into row 2 after the select — this fixes DOM tab order so select is tabbed before delete (status change before destructive action)
  - [ ] 3.2 Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` to the select's `class`
  - [ ] 3.3 Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2` to the delete button's `class`
  - [ ] 3.4 Keep all existing Tailwind layout classes from Story 4.1; only add focus-visible classes and restructure the two rows into one

- [ ] Task 4: Add ARIA live region for mutation success announcements in `frontend/src/views/HomeView.vue` (AC: #3)
  - [ ] 4.1 Add `import { computed, ref, nextTick, watch } from 'vue'` — add `ref`, `nextTick`, `watch` to the existing `computed` import
  - [ ] 4.2 Add `const liveMessage = ref('')` after the `updatingStatusId` computed
  - [ ] 4.3 Also destructure `isSuccess` from each mutation call (rename to avoid collisions):
    - `useCreateTodo(filters)` → also destructure `isSuccess: createSuccess`
    - `useDeleteTodo(filters)` → also destructure `isSuccess: deleteSuccess`
    - `useUpdateTodoStatus(filters)` → also destructure `isSuccess: updateSuccess`
  - [ ] 4.4 Add three watchers after `liveMessage` declaration:
    ```ts
    watch(createSuccess, async (val) => {
      if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Todo added' }
    })
    watch(deleteSuccess, async (val) => {
      if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Todo deleted' }
    })
    watch(updateSuccess, async (val) => {
      if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Status updated' }
    })
    ```
    The `nextTick()` between clearing and setting ensures the DOM updates so screen readers re-announce even when the same message is repeated (e.g. deleting two todos in sequence).
  - [ ] 4.5 Add visually-hidden live region as the first child of `<main>`:
    ```html
    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">{{ liveMessage }}</div>
    ```

- [ ] Task 5: Run lint and verify zero accessibility violations (AC: #5)
  - [ ] 5.1 Run `cd frontend && npx eslint . --cache` — must report 0 errors from `eslint-plugin-vuejs-accessibility`
  - [ ] 5.2 Run `cd frontend && npx oxlint . --fix` — must report 0 errors, 0 warnings
  - [ ] 5.3 Verify by inspection: every `<button>` has an `aria-label` or visible text; every `<input>` and `<select>` has `aria-label`; `role="alert"` on error messages; `role="status"` on loading and success indicators

- [ ] Task 6: Run full test suite and verify no regressions (AC: #1–#5)
  - [ ] 6.1 Run `cd frontend && npx vitest --run` — all 30 existing tests must pass
  - [ ] 6.2 TodoItem tests all use `aria-label` and text selectors — no test updates required for the template restructuring in Task 3
  - [ ] 6.3 No new unit tests required for the ARIA live region in HomeView (success announcement timing is an integration/e2e concern)
### Review Findings

- [x] [Review][Defer] `<time>` placed after delete button in action row — screen reader reads timestamp after destructive action; unconventional but not a WCAG violation [frontend/src/components/TodoItem.vue] — deferred, UX refinement candidate post-4.x
## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/components/StatusBadge.vue` — fully styled and semantically complete. Do NOT modify.
- `frontend/src/components/TodoList.vue` — `<ul aria-label="Todo list">` already present. Do NOT modify (no changes needed for 4.2).
- `frontend/src/api/todos.ts`, all Pinia stores, all composables — no changes needed.
- Error alerts: `role="alert"` is already on `deleteErr` and `updateStatusErr` divs in `HomeView.vue` and on the error state in `TodoList.vue` — these already satisfy AC4 for error state screen reader announcements. Do NOT duplicate or change them.
- `role="status"` on the loading state in `TodoList.vue` — already satisfies loading state announcement.

### Current Component State (after Story 4.1)

**`TodoItem.vue` current template structure** (two flex rows, delete in row 1):
```html
<div class="flex flex-col gap-2 py-4">
  <div class="flex items-start justify-between gap-3">
    <p class="flex-1 text-sm text-slate-800 break-words">description</p>
    <button aria-label="Delete todo" class="min-h-[44px] min-w-[44px] shrink-0 ...">Delete</button>
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge />
    <select aria-label="Change status" class="min-h-[44px] ...">...</select>
    <time class="text-xs text-slate-400">...</time>
  </div>
  <ul role="list" class="flex flex-wrap gap-1">...</ul>
</div>
```
**Current tab order**: delete button → select (WRONG — destructive action before status change)

**Target template structure** (single action row, select before delete):
```html
<div class="flex flex-col gap-2 py-4">
  <p class="text-sm text-slate-800 break-words">description</p>
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge />
    <select aria-label="Change status" class="min-h-[44px] ... focus-visible:ring-2 ...">...</select>
    <button aria-label="Delete todo" class="min-h-[44px] min-w-[44px] shrink-0 ... focus-visible:ring-2 ...">Delete</button>
    <time class="text-xs text-slate-400">...</time>
  </div>
  <ul role="list" class="flex flex-wrap gap-1">...</ul>
</div>
```
**Target tab order**: select → delete button (CORRECT — status change before destructive action)

Note: `<p>` loses `flex-1` (no longer in a flex row) — change to just `text-sm text-slate-800 break-words`.

### `focus-visible` vs `focus` in Tailwind v4

- Use `focus-visible:ring-*` on **buttons and selects** — only shows ring on keyboard navigation, not on mouse clicks (better UX)
- The input in `TodoForm.vue` already uses `focus:ring-*` — this is fine for text inputs (always appropriate to show focus on inputs)
- Tailwind v4 supports `focus-visible:` variants natively; no additional configuration needed

### ARIA Live Region Pattern

The `nextTick()` clear-then-set pattern is required because:
- Screen readers only re-announce when DOM content *changes*
- Setting `liveMessage.value = 'Todo deleted'` when it is already `'Todo deleted'` causes no new announcement
- Clearing to `''` first, then awaiting `nextTick()` (one DOM flush), then setting the message guarantees a content change on every mutation

`aria-atomic="true"` ensures the whole message is read at once, not just the changed characters.

`role="status"` = `aria-live="polite"` — announces after the user pauses, does not interrupt active speech. Appropriate for success messages. Error messages already use `role="alert"` (assertive, interrupts immediately) — do NOT change those.

### `sr-only` in Tailwind v4

`sr-only` is a built-in Tailwind utility class:
```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;
}
```
Visually hidden but still in the accessibility tree and announced by screen readers. Available in Tailwind v4 without any configuration.

### `isSuccess` from TanStack Vue Query `useMutation`

`useMutation` returns `isSuccess: Ref<boolean>`. It is `true` immediately after a successful mutation and resets to `false` when the next mutation is triggered or when `.reset()` is called. The Vue `watch()` will fire when it transitions `false → true`.

Destructure alongside the existing fields:
```ts
const {
  mutate: createTodo,
  isPending: createPending,
  isSuccess: createSuccess,  // ADD
  error: createErr,
} = useCreateTodo(filters)

const {
  mutate: deleteTodo,
  variables: deletingId,
  isSuccess: deleteSuccess,  // ADD
  error: deleteErr,
} = useDeleteTodo(filters)

const {
  mutate: updateStatus,
  variables: updatingStatusVars,
  isSuccess: updateSuccess,  // ADD
  error: updateStatusErr,
} = useUpdateTodoStatus(filters)
```

### Deferred Finding from Story 4.1 Code Review

The code review for 4.1 explicitly deferred: *"Delete button appears before status select in DOM tab order — deferred to Story 4.2 (keyboard navigation)"*. Task 3 in this story directly addresses that deferred finding.

### Previous Story Intelligence (from Story 4.1)

- **Pre-existing lint violations in test files**: In 4.1, `vi.fn()` calls lacked type parameters — fixed by adding `vi.fn<() => void>()` etc. All test files already have the correct type parameters after 4.1. No further changes needed.
- **Lint runs as `run-s lint:*`** — runs oxlint then ESLint sequentially. Both must pass.
- **All `TodoItem` tests use `aria-label` or text selectors** — the template restructuring in Task 3 (moving delete button from row 1 to row 2) will NOT break any existing test selectors.
- **`focus:outline-none focus:ring-2 focus:ring-blue-500`** already on the form input from 4.1 — do not add again, do not remove.

### Project Structure Notes

- Files to modify: `frontend/index.html`, `frontend/src/components/TodoItem.vue`, `frontend/src/components/TodoForm.vue`, `frontend/src/views/HomeView.vue`
- Files to leave unchanged: `TodoList.vue`, `StatusBadge.vue`, `App.vue`, all stores, all composables, all API files, all tests

### References

- [Epic 4 Story 4.2 definition — Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]
- [NFR8 WCAG 2.1 AA, NFR9 keyboard navigable, NFR11 screen reader — Source: _bmad-output/planning-artifacts/epics.md#NonFunctional-Requirements]
- [Deferred finding: tab order — Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred-from-code-review-of-4-1-responsive-layout]
- [ESLint vuejs-accessibility — Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements]
- [Component structure — Source: _bmad-output/planning-artifacts/architecture.md#Component-structure]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Task 5: `eslint-plugin-vuejs-accessibility` flagged `role="list"` on `<ul>` as redundant (`no-redundant-roles` rule) — removed from `TodoItem.vue`. The 4.1 code review had added it to address VoiceOver/Safari semantics, but the ESLint rule takes precedence as the project's lint gate. Deferred-work entry updated accordingly.

### Completion Notes List

- Task 1: `frontend/index.html` — `lang=""` → `lang="en"`. Screen readers now select correct speech engine.
- Task 2: `TodoForm.vue` submit button — added `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`. Keyboard users now see visible focus ring on button.
- Task 3: `TodoItem.vue` — removed two-row layout; restructured to description `<p>` (full width) then single action row: StatusBadge → select → delete → time. Tab order is now correct (select before delete). Both select and delete have `focus-visible` rings (blue and red respectively). `role="list"` removed from tags `<ul>` per lint rule.
- Task 4: `HomeView.vue` — added `ref`, `nextTick`, `watch` imports; `isSuccess` destructured from all three mutations; `liveMessage` ref with three watchers using nextTick clear-then-set pattern; `<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">` as first child of `<main>`.
- Task 5: oxlint 0/0, ESLint 0 errors after removing redundant `role="list"`.
- Task 6: 30/30 tests pass. No test file changes needed — all selectors are aria-label/text based.

### File List

- frontend/index.html
- frontend/src/components/TodoForm.vue
- frontend/src/components/TodoItem.vue
- frontend/src/views/HomeView.vue
