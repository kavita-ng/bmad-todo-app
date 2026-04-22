# Story 2.2: Todo List View with Empty, Loading, and Error States

Status: review

## Story

As Alex,
I want to open the app and immediately see all my todos (or an appropriate state if there are none, data is loading, or an error occurs),
So that I always know the true state of my list without ambiguity.

## Acceptance Criteria

1. **Given** the app loads with no todos in the database
   **When** the list renders
   **Then** an empty state message is displayed prompting the user to add their first todo (FR15)

2. **Given** the app is fetching todos from the API
   **When** the request is in flight
   **Then** a loading indicator is visible and the list area is not blank (FR16)

3. **Given** the API returns an error (e.g. server offline)
   **When** the fetch fails
   **Then** an error message is displayed clearly; no stale or incorrect data is shown; the user is not left in a blank state (FR17, NFR7)

4. **Given** todos exist in the database
   **When** the list renders
   **Then** each todo row displays: description, status label, and creation timestamp formatted as a human-readable date (FR2, FR4)

5. **Given** 50+ todos exist
   **When** the list renders
   **Then** all items render without visible performance degradation (NFR3)

## Tasks / Subtasks

- [x] Task 1: Create `frontend/src/types/todo.ts` with shared TypeScript types (AC: #4)
  - [x] 1.1 Define `TodoStatus` type and `Todo` interface matching API response shape
  - [x] 1.2 Define `PaginatedResponse<T>` interface matching `{ data: T[], pagination: { page, limit, total, hasMore } }`
  - [x] 1.3 Define `TodoFilters` interface `{ status?: TodoStatus; page?: number; limit?: number }`

- [x] Task 2: Create `frontend/src/api/todos.ts` (AC: #2, #3)
  - [x] 2.1 Export `getTodos(filters?: TodoFilters): Promise<PaginatedResponse<Todo>>` using `fetchApi` from `client.ts`
  - [x] 2.2 Build query string from filters using `URLSearchParams`
  - [x] 2.3 Re-export `ApiError` if needed by consuming code

- [x] Task 3: Create `frontend/src/composables/useTodos.ts` (AC: #2, #3, #4)
  - [x] 3.1 Implement `useTodos(filters: Ref<TodoFilters>)` composable using `useQuery`
  - [x] 3.2 Use `todoKeys` factory for query keys: `['todos', filters]`
  - [x] 3.3 Expose `{ data, isPending, isFetching, error, isError }` — no manual `isLoading` flags

- [x] Task 4: Create `frontend/src/stores/ui.ts` Pinia store (AC: none — prerequisite for future stories)
  - [x] 4.1 Store owns `statusFilter: TodoStatus | null` and `page: number` (default 1)
  - [x] 4.2 Export `useUiStore` with actions `setStatusFilter`, `setPage`, `resetFilters`

- [x] Task 5: Create `frontend/src/components/TodoList.vue` (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Accept `todos: Todo[]`, `isPending: boolean`, `isError: boolean`, `error: ApiError | null` as props
  - [x] 5.2 Render loading state when `isPending` is true (spinner or skeleton)
  - [x] 5.3 Render error state when `isError` is true with message from error or generic fallback
  - [x] 5.4 Render empty state when todos array is empty (and not loading/error)
  - [x] 5.5 Render `TodoItem.vue` for each todo otherwise

- [x] Task 6: Create `frontend/src/components/TodoItem.vue` (AC: #4)
  - [x] 6.1 Accept `todo: Todo` as prop
  - [x] 6.2 Render description, a `StatusBadge` (stub — just text for now), and formatted `createdAt`
  - [x] 6.3 Format `createdAt` ISO string as human-readable date (e.g. `Apr 22, 2026`) using `Intl.DateTimeFormat`

- [x] Task 7: Create stub `frontend/src/components/StatusBadge.vue` (AC: #4)
  - [x] 7.1 Accept `status: TodoStatus` as prop
  - [x] 7.2 Render status as human-readable label text only (`Draft`, `Ready`, `In Progress`, `Backlog`, `Completed`)
  - [x] 7.3 No colour logic yet — that is Story 3.2

- [x] Task 8: Update `frontend/src/views/HomeView.vue` (AC: #1–#4)
  - [x] 8.1 Replace scaffold content with `TodoList` wired to `useTodos` composable
  - [x] 8.2 Read filters from `useUiStore` and pass to `useTodos`

- [x] Task 9: Clean up `frontend/src/App.vue` (prerequisite)
  - [x] 9.1 Remove scaffold `HelloWorld`, `TheWelcome`, nav links, scoped styles — leave only `<RouterView />`
  - [x] 9.2 Update `frontend/src/router/index.ts` to remove the About route (only `/` pointing to `HomeView`)

- [x] Task 10: Write component tests (AC: #1–#4)
  - [x] 10.1 Test `TodoList.vue`: loading state, error state, empty state, list with items
  - [x] 10.2 Test `TodoItem.vue`: renders description, status text, formatted date
  - [x] 10.3 Test `StatusBadge.vue`: renders correct label for each of the 5 statuses

## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/api/client.ts` — already exported `fetchApi<T>` and `ApiError`. **Import from here.** Do not create a second fetch wrapper.
- `frontend/src/main.ts` — already registers TanStack Vue Query (`VueQueryPlugin`), Pinia, and Vue Router. No changes needed.
- `frontend/` project already has Tailwind CSS v4 installed via `@tailwindcss/vite` plugin — classes work already.
- `frontend/src/router/index.ts` — exists with a scaffold About route to be removed.
- `frontend/src/views/HomeView.vue` — exists with `TheWelcome` scaffold to be replaced.
- `frontend/src/App.vue` — exists with full scaffold (logo, nav, HelloWorld). **Must be cleaned up** (Task 9).
- `frontend/src/components/` — has scaffold files (`HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`). These can be deleted or left; do not reuse them.

### TypeScript Types

Create `frontend/src/types/todo.ts`:

```typescript
export type TodoStatus = 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'

export interface Todo {
  id: string
  description: string
  status: TodoStatus
  tags: string[]
  createdAt: string  // ISO 8601
  updatedAt: string  // ISO 8601
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface TodoFilters {
  status?: TodoStatus
  page?: number
  limit?: number
}
```

### API Layer (`frontend/src/api/todos.ts`)

```typescript
import { fetchApi } from './client.js'
import type { Todo, TodoFilters, PaginatedResponse } from '../types/todo.js'

export async function getTodos(filters: TodoFilters = {}): Promise<PaginatedResponse<Todo>> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  const query = params.toString()
  return fetchApi<PaginatedResponse<Todo>>(`/api/todos${query ? `?${query}` : ''}`)
}
```

**Important:** `fetchApi` already handles errors, normalises the base URL from `VITE_API_URL`, and throws `ApiError` on non-2xx. Do not add extra try/catch in `todos.ts`.

### TanStack Query Keys Factory

Always use this pattern — never inline raw string arrays:

```typescript
// frontend/src/composables/useTodos.ts
export const todoKeys = {
  all: ['todos'] as const,
  filtered: (filters: TodoFilters) => ['todos', filters] as const,
}
```

### `useTodos` Composable

```typescript
import { useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { getTodos } from '../api/todos.js'
import type { TodoFilters } from '../types/todo.js'
import { todoKeys } from './useTodos.js'

export function useTodos(filters: Ref<TodoFilters>) {
  return useQuery({
    queryKey: computed(() => todoKeys.filtered(filters.value)),
    queryFn: () => getTodos(filters.value),
  })
}
```

**CRITICAL:** `queryKey` must be `computed()` so it reacts to filter changes. A static key will never refetch when the filter changes.

**Expose from `useQuery`:** `data`, `isPending`, `isFetching`, `error`, `isError`.
**Do NOT create manual `isLoading` refs** — this is the architecture anti-pattern.

### Pinia UI Store

```typescript
// frontend/src/stores/ui.ts
import { defineStore } from 'pinia'
import type { TodoStatus } from '../types/todo.js'

export const useUiStore = defineStore('ui', {
  state: () => ({
    statusFilter: null as TodoStatus | null,
    page: 1,
  }),
  actions: {
    setStatusFilter(status: TodoStatus | null) {
      this.statusFilter = status
      this.page = 1  // Reset pagination when filter changes
    },
    setPage(page: number) {
      this.page = page
    },
    resetFilters() {
      this.statusFilter = null
      this.page = 1
    },
  },
})
```

### `TodoList.vue` Component Structure

```vue
<script setup lang="ts">
import type { Todo } from '../types/todo.js'
import type { ApiError } from '../api/client.js'
import TodoItem from './TodoItem.vue'

defineProps<{
  todos: Todo[]
  isPending: boolean
  isError: boolean
  error: ApiError | null | undefined
}>()
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isPending" role="status" aria-label="Loading todos">
      <!-- spinner or skeleton -->
    </div>

    <!-- Error state -->
    <div v-else-if="isError" role="alert">
      {{ error?.message || 'Something went wrong. Please try again.' }}
    </div>

    <!-- Empty state -->
    <div v-else-if="todos.length === 0">
      No todos yet. Add your first todo above.
    </div>

    <!-- List -->
    <ul v-else aria-label="Todo list">
      <li v-for="todo in todos" :key="todo.id">
        <TodoItem :todo="todo" />
      </li>
    </ul>
  </div>
</template>
```

**Accessibility requirements (enforced by `eslint-plugin-vuejs-accessibility`):**
- Loading spinner: `role="status"` + `aria-label`
- Error message: `role="alert"` (announces immediately to screen readers)
- List: `<ul>` + `<li>` with `aria-label`
- Do NOT use `<div>` as a list without role attributes

### `TodoItem.vue` Date Formatting

Use `Intl.DateTimeFormat` — no external library needed:

```typescript
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}
```

### `StatusBadge.vue` Label Map

```typescript
const STATUS_LABELS: Record<TodoStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  backlog: 'Backlog',
  completed: 'Completed',
}
```

No Tailwind colour classes yet — Story 3.2 adds the visual polish. For now render just the text label.

### `HomeView.vue` Wiring

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '../stores/ui.js'
import { useTodos } from '../composables/useTodos.js'
import TodoList from '../components/TodoList.vue'
import type { TodoFilters } from '../types/todo.js'

const uiStore = useUiStore()
const filters = computed<TodoFilters>(() => ({
  status: uiStore.statusFilter ?? undefined,
  page: uiStore.page,
}))
const { data, isPending, isError, error } = useTodos(filters)
const todos = computed(() => data.value?.data ?? [])
</script>

<template>
  <main>
    <TodoList
      :todos="todos"
      :is-pending="isPending"
      :is-error="isError"
      :error="error as any"
    />
  </main>
</template>
```

### Testing Pattern (Frontend)

Tests co-located with source. Use `@vue/test-utils` + Vitest:

```typescript
// frontend/src/components/__tests__/TodoList.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TodoList from '../TodoList.vue'

describe('TodoList', () => {
  it('shows loading state when isPending is true', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: true, isError: false, error: null },
    })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('shows error state when isError is true', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: false, isError: true, error: null },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows empty state when todos array is empty', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: false, isError: false, error: null },
    })
    expect(wrapper.text()).toContain('No todos yet')
  })
})
```

**`@vue/test-utils` is already installed** (included by `create-vue` when Vitest is selected).

### App.vue Cleanup

Replace entire `App.vue` with:

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>
```

Remove scaffold imports `HelloWorld`, `RouterLink`, all logo/nav markup.

### Router Cleanup

`frontend/src/router/index.ts` — keep only the `/` → `HomeView` route, remove the `/about` route entirely.

### Architecture Compliance Checklist

| Rule | Required |
|------|---------|
| No manual `isLoading` boolean | Use `isPending` from `useQuery` |
| `todoKeys` factory for all cache keys | `['todos', filters]` pattern |
| No direct `fetch` in components | Use `api/todos.ts` → `fetchApi` |
| No barrel `index.ts` files | Import directly from source |
| Tests co-located with source | `__tests__/` next to component |
| Test file suffix | `.test.ts` |
| Accessibility attributes | `role="status"`, `role="alert"`, `<ul>/<li>` for list |
| TypeScript types for all props | `defineProps<{...}>()` with explicit types |

### Previous Story Learnings (2.1 → 2.2)

- The formatter (Prettier) may convert single quotes to double quotes and add semicolons in `.ts` files. The tests still pass — this is cosmetic and acceptable.
- `STATUS_ENUM` values should be derived from source of truth rather than duplicated literals.
- AJV pattern `'\\S'` prevents whitespace-only strings.
- `ApiError` in `client.ts` uses `Object.setPrototypeOf` — `instanceof ApiError` works correctly.
- `client.ts` `fetchApi` returns `{} as T` for 204 responses. Don't try to parse body on delete.
- `frontend/src/api/client.ts` exports `ApiError` and `fetchApi` — use these exact exports.
- `@tanstack/vue-query` is registered as `VueQueryPlugin` in `main.ts` — already available.
- Tailwind CSS v4 utility classes work already via the `@tailwindcss/vite` plugin — no config file needed.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Implemented 7 new files: types, API layer, composable, Pinia store, 3 Vue components
- Updated 4 existing files: HomeView, App.vue, router, sprint-status
- 14 tests passing (4 test files: HelloWorld.spec, StatusBadge.test, TodoItem.test, TodoList.test)
- `queryKey` is `computed()` to react to filter changes (critical pattern)
- `todoKeys` factory used throughout; no manual `isLoading` flags
- StatusBadge renders text only — colour deferred to Story 3.2
- Accessibility: `role="status"` on loading, `role="alert"` on error, `<ul>/<li>` for list

### File List

- `frontend/src/types/todo.ts` (new)
- `frontend/src/api/todos.ts` (new)
- `frontend/src/composables/useTodos.ts` (new)
- `frontend/src/stores/ui.ts` (new)
- `frontend/src/components/TodoList.vue` (new)
- `frontend/src/components/TodoItem.vue` (new)
- `frontend/src/components/StatusBadge.vue` (new)
- `frontend/src/components/__tests__/TodoList.test.ts` (new)
- `frontend/src/components/__tests__/TodoItem.test.ts` (new)
- `frontend/src/components/__tests__/StatusBadge.test.ts` (new)
- `frontend/src/views/HomeView.vue` (modified)
- `frontend/src/App.vue` (modified)
- `frontend/src/router/index.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
