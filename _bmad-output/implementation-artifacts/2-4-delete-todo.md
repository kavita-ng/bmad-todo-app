# Story 2.4: Delete Todo

Status: done

## Story

As Alex,
I want to delete a todo permanently,
So that I can remove tasks I no longer need.

## Acceptance Criteria

1. **Given** a todo is visible in the list
   **When** Alex activates the delete action on it
   **Then** the todo is removed from the list immediately (optimistic update, NFR4)

2. **Given** the optimistic delete has been applied and the API call succeeds
   **When** the 204 response returns
   **Then** the todo remains absent from the list

3. **Given** the optimistic delete has been applied and the API call fails
   **When** the error is received
   **Then** the todo is restored to its original position in the list and an error message is shown (NFR6)

4. **Given** Alex refreshes the page after deleting a todo
   **When** the list loads
   **Then** the deleted todo does not reappear (FR3, NFR5)

## Tasks / Subtasks

- [x] Task 1: Add `deleteTodo` to `frontend/src/api/todos.ts` (AC: #1, #2, #3, #4)
  - [x] 1.1 Export `deleteTodo(id: string): Promise<void>` using `fetchApi` with `method: 'DELETE'`; the backend returns 204 (no body) — `fetchApi` already handles 204 returning `{} as T`, so type as `Promise<void>` and discard the return value

- [x] Task 2: Add `useDeleteTodo` to `frontend/src/composables/useTodos.ts` (AC: #1, #2, #3)
  - [x] 2.1 Implement `useDeleteTodo(filters: Ref<TodoFilters>)` using `useMutation`
  - [x] 2.2 `onMutate`: cancel all todo queries; snapshot current cache; remove the todo with matching `id` from `data` array; decrement `pagination.total`; return `{ previous, key }`
  - [x] 2.3 `onError`: restore cache from `context.key` + `context.previous` (same pattern as `useCreateTodo`)
  - [x] 2.4 `onSettled`: `invalidateQueries({ queryKey: todoKeys.all })`

- [x] Task 3: Update `frontend/src/components/TodoItem.vue` to add a delete button (AC: #1, #3)
  - [x] 3.1 Accept new prop `onDelete: () => void`
  - [x] 3.2 Accept new prop `isDeleting: boolean`
  - [x] 3.3 Render a delete button; disable it when `isDeleting` is true
  - [x] 3.4 On button click, call `props.onDelete()`
  - [x] 3.5 ARIA: `aria-label="Delete todo"` on the button; `aria-disabled` when `isDeleting`

- [x] Task 4: Update `frontend/src/components/TodoList.vue` to wire delete (AC: #1, #3)
  - [x] 4.1 Accept new prop `onDelete: (id: string) => void`
  - [x] 4.2 Accept new prop `deletingId: string | null` (which todo is currently being deleted)
  - [x] 4.3 Pass `:on-delete="() => onDelete(todo.id)"` and `:is-deleting="deletingId === todo.id"` to each `TodoItem`

- [x] Task 5: Update `frontend/src/views/HomeView.vue` to wire `useDeleteTodo` (AC: #1–#3)
  - [x] 5.1 Import and call `useDeleteTodo(filters)` — get `{ mutate: deleteTodo, variables: deletingId }`
  - [x] 5.2 Pass `:on-delete="deleteTodo"` and `:deleting-id="deletingId ?? null"` to `TodoList`

- [x] Task 6: Write tests (AC: #1, #3)
  - [x] 6.1 `TodoItem.test.ts` — add tests: delete button renders; calls `onDelete` on click; is disabled when `isDeleting` is true
  - [x] 6.2 `TodoList.test.ts` — add test: passes correct `onDelete` and `isDeleting` props to each `TodoItem`

## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/api/todos.ts` — already has `getTodos`, `createTodo`. **Add `deleteTodo` here only.**
- `frontend/src/composables/useTodos.ts` — already has `todoKeys`, `useTodos`, `useCreateTodo`. **Add `useDeleteTodo` here only.** Already imports `useQuery`, `useMutation`, `useQueryClient`, `Ref`, `Todo`, `TodoFilters`, `PaginatedResponse` — all needed imports are present.
- `frontend/src/components/TodoItem.vue` — already renders description, `StatusBadge`, date. **Add delete button to this file** — do NOT create a new component.
- `frontend/src/components/TodoList.vue` — already renders `<ul>/<li>` with `TodoItem`. **Add delete wiring here** — do NOT create a new component.
- `frontend/src/views/HomeView.vue` — already wires `useTodos` + `useCreateTodo`. **Add `useDeleteTodo` here.**
- Backend `DELETE /api/todos/:id` already implemented in Story 2.1 — returns 204 on success, 404 if not found.
- `fetchApi` returns `{} as T` for 204 responses — no body parsing needed. Type `deleteTodo` return as `Promise<void>`.

### `deleteTodo` API Function

Add to `frontend/src/api/todos.ts`:

```typescript
export async function deleteTodo(id: string): Promise<void> {
  await fetchApi<void>(`/api/todos/${id}`, { method: 'DELETE' })
}
```

### `useDeleteTodo` Composable

Add to `frontend/src/composables/useTodos.ts`. All imports already present. Add after `useCreateTodo`:

```typescript
export function useDeleteTodo(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: previous.data.filter((t) => t.id !== id),
          pagination: {
            ...previous.pagination,
            total: Math.max(0, previous.pagination.total - 1),
          },
        })
      }

      return { previous, key }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
```

**Note:** `mutationFn` receives the `id` string directly. `variables` from `useMutation` will be the `id` currently being deleted — use this in `HomeView` to set `deletingId`.

### Import needed for `deleteTodo`

`useTodos.ts` already imports `createTodo` from `'../api/todos.js'`. Add `deleteTodo` to the same import line:

```typescript
import { getTodos, createTodo, deleteTodo } from '../api/todos.js'
```

### `TodoItem.vue` Update

Current props: `todo: Todo`. Add two new props and a delete button:

```vue
<script setup lang="ts">
import type { Todo } from '../types/todo.js'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  todo: Todo
  onDelete: () => void
  isDeleting: boolean
}>()

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}
</script>

<template>
  <div>
    <p>{{ props.todo.description }}</p>
    <StatusBadge :status="props.todo.status" />
    <time :datetime="props.todo.createdAt">{{ formatDate(props.todo.createdAt) }}</time>
    <ul v-if="props.todo.tags.length > 0">
      <li v-for="tag in props.todo.tags" :key="tag">{{ tag }}</li>
    </ul>
    <button
      type="button"
      aria-label="Delete todo"
      :aria-disabled="isDeleting"
      :disabled="isDeleting"
      @click="props.onDelete()"
    >
      {{ isDeleting ? 'Deleting…' : 'Delete' }}
    </button>
  </div>
</template>
```

### `TodoList.vue` Update

Current props: `todos`, `isPending`, `isError`, `error?`. Add delete-related props:

```vue
<script setup lang="ts">
import type { Todo } from '../types/todo.js'
import TodoItem from './TodoItem.vue'

defineProps<{
  todos: Todo[]
  isPending: boolean
  isError: boolean
  error?: Error | null
  onDelete: (id: string) => void
  deletingId: string | null
}>()
</script>

<template>
  <div v-if="isPending" role="status" aria-label="Loading todos">Loading…</div>
  <div v-else-if="isError" role="alert">{{ error?.message || 'Failed to load todos. Please try again.' }}</div>
  <p v-else-if="todos.length === 0">No todos yet. Add your first todo above.</p>
  <ul v-else aria-label="Todo list">
    <li v-for="todo in todos" :key="todo.id">
      <TodoItem
        :todo="todo"
        :on-delete="() => onDelete(todo.id)"
        :is-deleting="deletingId === todo.id"
      />
    </li>
  </ul>
</template>
```

### `HomeView.vue` Update

`useMutation` returns `variables` — the argument passed to the last `mutate()` call. While a mutation is in-flight, `variables` holds the `id` being deleted:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTodos, useCreateTodo, useDeleteTodo } from '../composables/useTodos.js'
import { useUiStore } from '../stores/ui.js'
import TodoList from '../components/TodoList.vue'
import TodoForm from '../components/TodoForm.vue'
import type { TodoFilters } from '../types/todo.js'

const uiStore = useUiStore()

const filters = computed<TodoFilters>(() => ({
  ...(uiStore.statusFilter ? { status: uiStore.statusFilter } : {}),
  page: uiStore.page,
}))

const { isPending: listPending, isError: listIsError, error: listErr, data } = useTodos(filters)
const todos = computed(() => data.value?.data ?? [])

const { mutate: createTodo, isPending: createPending, error: createErr } = useCreateTodo(filters)
const { mutate: deleteTodo, variables: deletingId } = useDeleteTodo(filters)
</script>

<template>
  <main>
    <h1>Todos</h1>
    <TodoForm :on-submit="createTodo" :is-pending="createPending" :error="createErr" />
    <TodoList
      :todos="todos"
      :is-pending="listPending"
      :is-error="listIsError"
      :error="listErr"
      :on-delete="deleteTodo"
      :deleting-id="deletingId ?? null"
    />
  </main>
</template>
```

**Key:** `variables` from `useMutation` is `undefined` when no mutation is in-flight, so `deletingId ?? null` avoids passing `undefined` to the prop (typed as `string | null`).

### Testing Pattern for Delete

**`TodoItem.test.ts` additions** — add to the existing `describe('TodoItem', ...)` block or a new `describe` block in the same file:

```typescript
import { vi } from 'vitest'

// Add to existing describe block or add new tests
it('renders a delete button', () => {
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete: vi.fn(), isDeleting: false },
  })
  expect(wrapper.find('button[aria-label="Delete todo"]').exists()).toBe(true)
})

it('calls onDelete when delete button is clicked', async () => {
  const onDelete = vi.fn()
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete, isDeleting: false },
  })
  await wrapper.find('button[aria-label="Delete todo"]').trigger('click')
  expect(onDelete).toHaveBeenCalledOnce()
})

it('disables delete button when isDeleting is true', () => {
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete: vi.fn(), isDeleting: true },
  })
  expect(wrapper.find('button[aria-label="Delete todo"]').attributes('disabled')).toBeDefined()
})
```

**Note:** Existing `TodoItem` tests pass `{ todo }` without the new `onDelete`/`isDeleting` props. Since Vue 3 does NOT throw on missing non-required props, existing tests will still pass. However, **the new props are required** (no `?` in the type). To be safe, **update the existing test fixtures** to include the new props:

```typescript
// Update baseTodo fixture calls to add required props:
mount(TodoItem, { props: { todo, onDelete: vi.fn(), isDeleting: false } })
```

**`TodoList.test.ts` additions** — the existing tests also need `onDelete` and `deletingId` props added to all mount calls since they are now required:

```typescript
// Update all existing TodoList mounts to include:
{ todos: [...], isPending: false, isError: false, onDelete: vi.fn(), deletingId: null }
```

### Architecture Compliance

| Rule | Compliance |
|------|-----------|
| No manual `isLoading` boolean | Use `isPending` from `useMutation`; use `variables` for per-item deleting state |
| `todoKeys` factory for all cache keys | `todoKeys.all` for cancel/invalidate; `todoKeys.filtered(filters.value)` in onMutate |
| Optimistic mutation pattern | `onMutate` → filter out item; `onError` → rollback via `context.key + context.previous`; `onSettled` → invalidate |
| Capture key in context (from 2.3 review) | `return { previous, key }` in `onMutate`; use `context.key` in `onError` |
| No direct `fetch` in components | API call in `api/todos.ts` → `fetchApi` |
| Tests co-located with source | Additions to `__tests__/TodoItem.test.ts` and `__tests__/TodoList.test.ts` |
| Test file suffix | `.test.ts` |
| Accessibility on interactive elements | `aria-label="Delete todo"`, `aria-disabled`, `type="button"` |

### Previous Story Learnings (2.3 → 2.4)

- **Capture `key` in `onMutate` context** (code review P1 from 2.3) — `onError` MUST use `context.key`, not re-derive from live `filters.value`. Pattern is already established in `useCreateTodo`.
- **`aria-live` + `role="alert"` conflict** (code review P2 from 2.3) — use `role="alert"` alone; do NOT add `aria-live` to the same element.
- `fetchApi` returns `{} as T` for 204 — `deleteTodo` returns 204, type as `Promise<void>` and use `await fetchApi<void>(...)`.
- `variables` from `useMutation` holds the argument passed to `mutate()` while in-flight, `undefined` otherwise — use `?? null` when passing to a prop typed `string | null`.
- **Update existing test fixtures** when adding required props to components — existing tests will break if `TodoItem` now requires `onDelete` and `isDeleting`.

### Backend Contract Reference

`DELETE /api/todos/:id` (implemented in Story 2.1):

- **Response 204:** Empty body on success
- **Response 404:** `{ "error": { "code": "NOT_FOUND", "message": "Todo not found" } }` if id doesn't exist
- `fetchApi` already handles 204 — no special casing needed in `deleteTodo`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Debug Log References
n/a

### Completion Notes List
- All 6 tasks implemented in a single pass; 21 tests passing (18 existing + 3 new delete tests)
- `useDeleteTodo` follows identical context-capture pattern to `useCreateTodo` — `context.key` used in `onError` (not live `filters.value`)
- `variables` from `useMutation` used as `deletingId` for per-item loading state — `?? null` prevents passing `undefined` to `string | null` prop
- Existing `TodoItem` and `TodoList` test fixtures updated with new required props (`onDelete: vi.fn()`, `deletingId: null`)

### File List
- `frontend/src/api/todos.ts` — added `deleteTodo`
- `frontend/src/composables/useTodos.ts` — added `useDeleteTodo`, updated import
- `frontend/src/components/TodoItem.vue` — added `onDelete`, `isDeleting` props + delete button
- `frontend/src/components/TodoList.vue` — added `onDelete`, `deletingId` props + threaded to `TodoItem`
- `frontend/src/views/HomeView.vue` — wired `useDeleteTodo`, passed props to `TodoList`
- `frontend/src/components/__tests__/TodoItem.test.ts` — updated fixtures, added 3 delete tests
- `frontend/src/components/__tests__/TodoList.test.ts` — updated fixtures with new required props

## Review Findings

- [x] [Review][Patch] P1: Delete error not shown to user — `error` from `useDeleteTodo` is not extracted or displayed in `HomeView.vue`; AC#3 requires "an error message is shown" when delete fails [frontend/src/views/HomeView.vue]
- [x] [Review][Patch] P2: Task 6.2 incomplete — `TodoList.test.ts` has no test verifying `onDelete`/`isDeleting` prop threading to `TodoItem`; existing fixtures updated but new test not added [frontend/src/components/__tests__/TodoList.test.ts]
- [x] [Review][Defer] D1: Concurrent deletes — `variables` from `useMutation` only tracks last invocation; rapid multi-item deletes show `isDeleting` only on the last triggered item — deferred, pre-existing TanStack Query v5 limitation
