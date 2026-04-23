# Story 3.3: Status Change Interaction

Status: done

## Story

As Alex,
I want to change a todo's status to any of the five states from the todo row,
So that I can move tasks through my workflow without leaving the list.

## Acceptance Criteria

1. **Given** a todo row is visible
   **When** Alex interacts with the status control (e.g. dropdown or segmented selector)
   **Then** all five status options are presented: `Draft`, `Ready`, `In Progress`, `Backlog`, `Completed` (FR6)

2. **Given** Alex selects a new status
   **When** the change is submitted
   **Then** the `StatusBadge` updates immediately to the new status — before the API response returns (NFR4 optimistic update)

3. **Given** the optimistic status update has been applied and the API call succeeds
   **When** the PATCH response returns
   **Then** the displayed status matches the server-confirmed value (no flicker)

4. **Given** the optimistic status update has been applied and the API call fails
   **When** the error is received
   **Then** the status reverts to its previous value and an error message is shown (NFR6)

5. **Given** a new todo is created
   **When** it appears in the list
   **Then** its status badge shows `Draft` (FR7) — already satisfied by Story 2.3 (createTodo sets `status: 'draft'`); no new work needed

6. **Given** Alex sets a todo to `Backlog` or `Completed`
   **When** it renders in the list
   **Then** it is visually de-emphasised relative to active todos (FR8, FR13) — already satisfied by Story 3.2 (`StatusBadge` styling); no new work needed

## Tasks / Subtasks

- [ ] Task 1: Add `patchTodoStatus` to `frontend/src/api/todos.ts` (AC: #2, #3, #4)
  - [x] 1.1 Export `patchTodoStatus(id: string, status: TodoStatus): Promise<Todo>` using `fetchApi('/api/todos/${id}', { method: 'PATCH', body: JSON.stringify({ status }) })` — returns the full updated `Todo`

- [x] Task 2: Add `useUpdateTodoStatus` to `frontend/src/composables/useTodos.ts` (AC: #2, #3, #4)
  - [x] 2.1 Implement `useUpdateTodoStatus(filters: Ref<TodoFilters>)` using `useMutation`
  - [x] 2.2 `mutationFn`: receives `{ id: string, status: TodoStatus }` — calls `patchTodoStatus(id, status)`
  - [x] 2.3 `onMutate`: cancel all todo queries; snapshot cache; optimistically update the matching todo's `status` in place (map over `data`, replace matching id's status); capture `key` from `filters.value`; return `{ previous, key }`
  - [x] 2.4 `onError`: restore cache from `context.key` + `context.previous` (same pattern as `useCreateTodo`/`useDeleteTodo`)
  - [x] 2.5 `onSettled`: `invalidateQueries({ queryKey: todoKeys.all })`

- [x] Task 3: Add a `<select>` status control to `frontend/src/components/TodoItem.vue` (AC: #1, #2, #4)
  - [x] 3.1 Add props `onStatusChange: (status: TodoStatus) => void` and `isUpdatingStatus: boolean`
  - [x] 3.2 Render a `<select>` with 5 `<option>` elements (one per status) below the `StatusBadge`
  - [x] 3.3 `:value="props.todo.status"` — select reflects current status
  - [x] 3.4 `@change` emits the new value to `props.onStatusChange(event.target.value as TodoStatus)`
  - [x] 3.5 `:disabled="isUpdatingStatus"` + `:aria-disabled="isUpdatingStatus"` when update in flight
  - [x] 3.6 `<label>` for the select: `aria-label="Change status"` on the `<select>` (or a visually-hidden `<label>`)

- [x] Task 4: Update `frontend/src/components/TodoList.vue` to wire status change (AC: #1, #2, #4)
  - [x] 4.1 Add prop `onStatusChange: (id: string, status: TodoStatus) => void`
  - [x] 4.2 Add prop `updatingStatusId: string | null`
  - [x] 4.3 Pass `:on-status-change="(status) => onStatusChange(todo.id, status)"` and `:is-updating-status="updatingStatusId === todo.id"` to each `TodoItem`

- [x] Task 5: Wire `useUpdateTodoStatus` in `frontend/src/views/HomeView.vue` (AC: #2, #3, #4)
  - [x] 5.1 Import and call `useUpdateTodoStatus(filters)` — get `{ mutate: updateStatus, variables: updatingStatusVars, error: updateStatusErr }`
  - [x] 5.2 Derive `updatingStatusId = computed(() => updatingStatusVars.value?.id ?? null)`
  - [x] 5.3 Pass `:on-status-change="(id, status) => updateStatus({ id, status })"` and `:updating-status-id="updatingStatusId"` to `TodoList`
  - [x] 5.4 Render `<div v-if="updateStatusErr" role="alert">{{ updateStatusErr.message }}</div>` alongside the existing `deleteErr` alert

- [x] Task 6: Tests (AC: #1, #2, #4)
  - [x] 6.1 `TodoItem.test.ts` — update all existing mounts to include new required props (`onStatusChange: vi.fn()`, `isUpdatingStatus: false`); add tests: select renders with 5 options, calls `onStatusChange` on change, is disabled when `isUpdatingStatus` is true
  - [x] 6.2 `TodoList.test.ts` — update all existing mounts to include new required props (`onStatusChange: vi.fn()`, `updatingStatusId: null`)

## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/api/todos.ts` — already has `getTodos`, `createTodo`, `deleteTodo`. **Add `patchTodoStatus` here only.**
- `frontend/src/composables/useTodos.ts` — already has `todoKeys`, `useTodos`, `useCreateTodo`, `useDeleteTodo`. All imports present: `useQuery`, `useMutation`, `useQueryClient`, `Ref`, `Todo`, `TodoFilters`, `PaginatedResponse`. **Add `useUpdateTodoStatus` here only.**
- `frontend/src/components/TodoItem.vue` — already has `todo: Todo`, `onDelete: () => void`, `isDeleting: boolean` props + delete button. **Add status control here only.**
- `frontend/src/components/TodoList.vue` — already has `onDelete`, `deletingId` props. **Add `onStatusChange`, `updatingStatusId` here only.**
- `frontend/src/views/HomeView.vue` — already wires `useTodos`, `useCreateTodo`, `useDeleteTodo`. **Add `useUpdateTodoStatus` here only.**
- `StatusBadge` in `TodoItem.vue` already shows the current status. After an optimistic update, the `todo.status` in the cache will have changed — `StatusBadge` will automatically reflect it since it reads from `props.todo.status`. No changes needed to `StatusBadge`.
- AC#5 and AC#6 are already satisfied by previous stories — no work needed.

### `patchTodoStatus` API Function

Add to `frontend/src/api/todos.ts`:

```typescript
export async function patchTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  return fetchApi<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
```

Also add `TodoStatus` to the import from `'../types/todo.js'`:

```typescript
import type { Todo, TodoStatus, TodoFilters, PaginatedResponse } from '../types/todo.js'
```

### `useUpdateTodoStatus` Composable

Add to `frontend/src/composables/useTodos.ts` after `useDeleteTodo`. Also add `patchTodoStatus` to the import from `'../api/todos.js'` and `TodoStatus` to the import from `'../types/todo.js'`:

```typescript
import { getTodos, createTodo, deleteTodo, patchTodoStatus } from '../api/todos.js'
import type { Todo, TodoStatus, TodoFilters, PaginatedResponse } from '../types/todo.js'
```

```typescript
export function useUpdateTodoStatus(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      patchTodoStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: previous.data.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
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

**Key notes:**
- `onMutate` maps over `data`, replacing the matching todo's `status` in-place — does NOT change `total` or `pagination` (unlike create/delete)
- Pattern is identical to `useCreateTodo`/`useDeleteTodo` — `context.key` captured in `onMutate` used in `onError` (code review lesson from 2.3)
- `mutationFn` receives `{ id, status }` object — `variables` from `useMutation` will be this object

### `TodoItem.vue` Update

Current props: `todo: Todo`, `onDelete: () => void`, `isDeleting: boolean`. Add two new props and a `<select>`:

```vue
<script setup lang="ts">
import type { Todo, TodoStatus } from '../types/todo.js'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  todo: Todo
  onDelete: () => void
  isDeleting: boolean
  onStatusChange: (status: TodoStatus) => void
  isUpdatingStatus: boolean
}>()

// STATUS_OPTIONS for the select — ordered for workflow
const STATUS_OPTIONS: Array<{ value: TodoStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'completed', label: 'Completed' },
]

function formatDate(iso: string): string { /* ... unchanged ... */ }
</script>

<template>
  <div>
    <p>{{ props.todo.description }}</p>
    <StatusBadge :status="props.todo.status" />
    <select
      aria-label="Change status"
      :value="props.todo.status"
      :disabled="isUpdatingStatus"
      :aria-disabled="isUpdatingStatus"
      @change="props.onStatusChange(($event.target as HTMLSelectElement).value as TodoStatus)"
    >
      <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
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

**Important:** `TodoStatus` must be imported in `TodoItem.vue` (currently only `Todo` is imported). Add `TodoStatus` to the import.

### `TodoList.vue` Update

Current props: `todos`, `isPending`, `isError`, `error?`, `onDelete`, `deletingId`. Add two new props:

```vue
defineProps<{
  todos: Todo[]
  isPending: boolean
  isError: boolean
  error?: Error | null
  onDelete: (id: string) => void
  deletingId: string | null
  onStatusChange: (id: string, status: TodoStatus) => void
  updatingStatusId: string | null
}>()
```

Also add `TodoStatus` to imports in `TodoList.vue`:

```typescript
import type { Todo, TodoStatus } from '../types/todo.js'
```

Pass to each `TodoItem`:

```html
<TodoItem
  :todo="todo"
  :on-delete="() => onDelete(todo.id)"
  :is-deleting="deletingId === todo.id"
  :on-status-change="(status) => onStatusChange(todo.id, status)"
  :is-updating-status="updatingStatusId === todo.id"
/>
```

### `HomeView.vue` Update

```typescript
const { mutate: updateStatus, variables: updatingStatusVars, error: updateStatusErr } = useUpdateTodoStatus(filters)
const updatingStatusId = computed(() => updatingStatusVars.value?.id ?? null)
```

Also add `useUpdateTodoStatus` to the import from `useTodos.js`.

Template additions:

```html
<div v-if="updateStatusErr" role="alert">{{ updateStatusErr.message }}</div>
<TodoList
  :todos="todos"
  :is-pending="listPending"
  :is-error="listIsError"
  :error="listErr"
  :on-delete="deleteTodo"
  :deleting-id="deletingId ?? null"
  :on-status-change="(id, status) => updateStatus({ id, status })"
  :updating-status-id="updatingStatusId"
/>
```

### Testing Pattern

**`TodoItem.test.ts`** — all existing mounts need `onStatusChange: vi.fn()` and `isUpdatingStatus: false`. New tests:

```typescript
it('renders a select with 5 status options', () => {
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete: vi.fn(), isDeleting: false, onStatusChange: vi.fn(), isUpdatingStatus: false },
  })
  expect(wrapper.find('select[aria-label="Change status"]').exists()).toBe(true)
  expect(wrapper.findAll('option')).toHaveLength(5)
})

it('calls onStatusChange when select changes', async () => {
  const onStatusChange = vi.fn()
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete: vi.fn(), isDeleting: false, onStatusChange, isUpdatingStatus: false },
  })
  await wrapper.find('select').setValue('ready')
  expect(onStatusChange).toHaveBeenCalledWith('ready')
})

it('disables select when isUpdatingStatus is true', () => {
  const wrapper = mount(TodoItem, {
    props: { todo, onDelete: vi.fn(), isDeleting: false, onStatusChange: vi.fn(), isUpdatingStatus: true },
  })
  expect(wrapper.find('select').attributes('disabled')).toBeDefined()
})
```

**Note on `setValue`:** `@vue/test-utils` `setValue()` on a `<select>` sets the value AND triggers both `input` and `change` events — the `@change` handler will fire.

**`TodoList.test.ts`** — update all mounts to add `onStatusChange: vi.fn()` and `updatingStatusId: null`.

### Architecture Compliance

| Rule | Compliance |
|------|-----------|
| Optimistic mutation pattern | `onMutate` → map status; `onError` → rollback via `context.key`; `onSettled` → invalidate |
| Capture `key` in context | `return { previous, key }` in `onMutate`; `context.key` in `onError` |
| No manual `isLoading` boolean | `isUpdatingStatus` derived from `variables.id` via `computed` |
| `todoKeys` factory for all cache keys | `todoKeys.all` cancel/invalidate; `todoKeys.filtered` snapshot |
| `TodoStatus` import | Must be imported in `TodoItem.vue`, `TodoList.vue`, and `api/todos.ts` — add to existing import lines |
| No `aria-live` + `role="alert"` conflict | `role="alert"` alone; no `aria-live` |
| `type="button"` on buttons | Existing delete button already has it; select doesn't need it |

### Previous Story Learnings Relevant to This Story

- **Capture `key` in `onMutate`** (2.3 P1) — `onError` uses `context.key`, not live `filters.value`
- **`variables` is `undefined` when idle** — use `?.id ?? null` for `updatingStatusId`
- **Update all existing test fixtures** when adding required props (2.4) — all `TodoItem` and `TodoList` mounts in tests need `onStatusChange: vi.fn()` and `isUpdatingStatus: false` / `updatingStatusId: null`
- **`role="alert"` alone, no `aria-live`** (2.3 P2) — already applied to error divs

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

No blockers encountered.

### Completion Notes List

- All 6 tasks completed. 30 frontend tests passing.
- `patchTodoStatus` added to `api/todos.ts`; `useUpdateTodoStatus` added to `useTodos.ts`
- `TodoItem.vue` gains `<select aria-label="Change status">` with 5 options + `onStatusChange`/`isUpdatingStatus` props
- `TodoList.vue` + `HomeView.vue` wired end-to-end with optimistic update + rollback pattern
- AC#5 and AC#6 confirmed already satisfied by prior stories; no additional work needed

### File List

- frontend/src/api/todos.ts
- frontend/src/composables/useTodos.ts
- frontend/src/components/TodoItem.vue
- frontend/src/components/TodoList.vue
- frontend/src/views/HomeView.vue
- frontend/src/components/__tests__/TodoItem.test.ts
- frontend/src/components/__tests__/TodoList.test.ts
