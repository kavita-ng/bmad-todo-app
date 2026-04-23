# Story 3.2: Status Display — StatusBadge Component

Status: done

## Story

As Alex,
I want every todo to display its status as a clearly labelled badge,
So that I can distinguish all five states at a glance without any additional interaction.

## Acceptance Criteria

1. **Given** a todo with any of the five statuses is rendered
   **When** the `StatusBadge` component displays it
   **Then** the badge shows the status as a human-readable text label (`Draft`, `Ready`, `In Progress`, `Backlog`, `Completed`) — not a raw enum value (FR12, FR14)

2. **Given** the `StatusBadge` displays statuses
   **When** examined for accessibility
   **Then** status is conveyed by text label (and optionally colour/icon) — colour is never the sole indicator (FR14, NFR10)

3. **Given** active todos (`Draft`, `Ready`, `In Progress`) and terminal todos (`Backlog`, `Completed`) are both present
   **When** the list renders
   **Then** active todos are visually prominent (e.g. higher contrast, bolder label) and terminal todos are visually de-emphasised (e.g. muted colour, lighter weight) (FR13)

## Tasks / Subtasks

- [x] Task 1: Add visual styling to `frontend/src/components/StatusBadge.vue` (AC: #1, #2, #3)
  - [x] 1.1 Wrap the `<span>` in a styled badge: apply a `data-status` attribute (e.g. `data-status="draft"`) so CSS can target each status independently without class-name fragility
  - [x] 1.2 Add Tailwind CSS classes to the `<span>` for base badge shape (inline-flex, rounded, padding, font-size)
  - [x] 1.3 Apply colour classes for active statuses (`draft`, `ready`, `in_progress`) — visually prominent (higher contrast, bolder)
  - [x] 1.4 Apply colour classes for terminal statuses (`backlog`, `completed`) — visually de-emphasised (muted, lighter weight)
  - [x] 1.5 Text label is always present — colour is supplementary, never the sole indicator (AC#2)

- [x] Task 2: Update existing `StatusBadge` tests and add visual-class tests (AC: #1, #2, #3)
  - [x] 2.1 Existing 5 label tests already pass — confirm they still pass with new markup
  - [x] 2.2 Add test: active statuses (`draft`, `ready`, `in_progress`) render with a CSS class that indicates active/prominent styling
  - [x] 2.3 Add test: terminal statuses (`backlog`, `completed`) render with a CSS class that indicates muted/de-emphasised styling

## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/components/StatusBadge.vue` — **already exists** with:
  - `status: TodoStatus` prop
  - `STATUS_LABELS` map (all 5 labels correct)
  - `<span>{{ STATUS_LABELS[props.status] }}</span>` template — the text label is already right
  - **Only task: add styling.** Do NOT change the label logic or prop interface.
- `frontend/src/components/__tests__/StatusBadge.test.ts` — 5 existing tests using `it.each` to verify all 5 labels. These must continue to pass.
- Tailwind CSS v4 is already configured via `@tailwindcss/vite` plugin — use utility classes directly, no `tailwind.config.js` needed.

### Recommended Colour Scheme

Use Tailwind v4 utility classes. The badge `<span>` should have:

**Base classes (all statuses):**
```
inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
```

**Active statuses** (`draft`, `ready`, `in_progress`) — prominent:
| Status | Background | Text |
|--------|-----------|------|
| `draft` | `bg-slate-100` | `text-slate-700` |
| `ready` | `bg-blue-100` | `text-blue-700` |
| `in_progress` | `bg-amber-100` | `text-amber-700` |

**Terminal statuses** (`backlog`, `completed`) — de-emphasised (muted, lighter weight):
| Status | Background | Text |
|--------|-----------|------|
| `backlog` | `bg-gray-100` | `text-gray-400` |
| `completed` | `bg-green-100` | `text-green-500` |

Terminal statuses should also use `font-normal` instead of `font-medium` to visually de-emphasise them.

### Recommended Implementation

Use a computed class map in the script. This keeps the template clean and is easy to test:

```vue
<script setup lang="ts">
import type { TodoStatus } from '../types/todo.js'

const props = defineProps<{
  status: TodoStatus
}>()

const STATUS_LABELS: Record<TodoStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  backlog: 'Backlog',
  completed: 'Completed',
}

const STATUS_CLASSES: Record<TodoStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 font-medium',
  ready: 'bg-blue-100 text-blue-700 font-medium',
  in_progress: 'bg-amber-100 text-amber-700 font-medium',
  backlog: 'bg-gray-100 text-gray-400 font-normal',
  completed: 'bg-green-100 text-green-500 font-normal',
}
</script>

<template>
  <span
    :data-status="props.status"
    :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs', STATUS_CLASSES[props.status]]"
  >
    {{ STATUS_LABELS[props.status] }}
  </span>
</template>
```

**Why `data-status`:** lets tests do `wrapper.find('[data-status="draft"]')` rather than checking specific colour class strings. This decouples tests from colour choices — if you later change `bg-slate-100` to `bg-zinc-100`, tests don't break.

### Testing Strategy

AC#1 (text labels) is already covered by existing tests. The new tests cover AC#2/#3 (visual distinction).

**Approach:** Test for the presence of a CSS class or `data-status` attribute — NOT for specific Tailwind colour values (those are an implementation detail). Use shared marker classes like `font-medium` vs `font-normal` as the observable proxy for "prominent" vs "de-emphasised":

```typescript
const activeCases: TodoStatus[] = ['draft', 'ready', 'in_progress']
const terminalCases: TodoStatus[] = ['backlog', 'completed']

it.each(activeCases)('active status "%s" renders with font-medium class', (status) => {
  const wrapper = mount(StatusBadge, { props: { status } })
  expect(wrapper.find('span').classes()).toContain('font-medium')
})

it.each(terminalCases)('terminal status "%s" renders with font-normal class', (status) => {
  const wrapper = mount(StatusBadge, { props: { status } })
  expect(wrapper.find('span').classes()).toContain('font-normal')
})
```

**Why `font-medium`/`font-normal` not colours:** Colour class names are an aesthetic choice that might change; the active/terminal semantic distinction maps reliably to font weight which is stable.

### Architecture Compliance

| Rule | Compliance |
|------|-----------|
| Tailwind v4 — no config needed | Use utility classes directly on elements |
| Text label always present | `STATUS_LABELS` map unchanged — colour is supplementary |
| No `aria-live` on display-only elements | `<span>` is static display, no ARIA roles needed |
| Tests co-located | Updates to `__tests__/StatusBadge.test.ts` only |
| Do not add style scoped for Tailwind | Tailwind works via utility classes — no `<style scoped>` block needed |
| `data-status` attribute | Allows stable test targeting decoupled from colour choices |

### Previous Story Learnings Relevant to This Story

- **No `<style scoped>` blocks** (code review 2.2 P2) — previously a dead `<style scoped>` was removed from App.vue. For Tailwind components, use utility classes only, no scoped styles.
- **Text always present, colour supplementary** — the existing `<span>{{ STATUS_LABELS[props.status] }}</span>` satisfies AC#1/#2; styling adds AC#3. Do NOT remove the text label.

### What This Story Does NOT Change

- `StatusBadge` props (`status: TodoStatus`) — unchanged
- `STATUS_LABELS` map — unchanged
- `TodoItem.vue` — already uses `<StatusBadge :status="props.todo.status" />` — no changes needed there
- Backend — this is frontend-only

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Debug Log References
n/a

### Completion Notes List
- Implemented in a single pass; 27 frontend tests passing (22 existing + 5 new)
- Added `STATUS_CLASSES` map + `data-status` attribute + Tailwind utility classes to `StatusBadge.vue`
- Active statuses use `font-medium`; terminal statuses use `font-normal` — stable semantic proxy for test assertions
- Tests use `font-medium`/`font-normal` class checks, not specific colour class names — decoupled from aesthetic choices

### File List
- `frontend/src/components/StatusBadge.vue` — added `STATUS_CLASSES` map, `data-status` attr, Tailwind badge classes
- `frontend/src/components/__tests__/StatusBadge.test.ts` — added 5 new tests (3 active + 2 terminal font-weight checks)

## Review Findings

✅ Clean review — all layers passed. 3 dismissed as noise (font-normal cascade correct; array class binding correct; `find('span')` vs root wrapper — functional equivalence).
