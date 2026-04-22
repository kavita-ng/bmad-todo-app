# Story 2.3: Create Todo

Status: done

## Story

As Alex,
I want to type a description and add a new todo without leaving the main view,
So that I can capture tasks quickly without interruption.

## Acceptance Criteria

1. **Given** the main view is open
   **When** Alex types a description into the input and submits (button click or Enter key)
   **Then** the todo appears at the top of the list immediately — before the API response returns (NFR4 optimistic update)

2. **Given** the optimistic update has been applied and the API call succeeds
   **When** the response returns
   **Then** the optimistic item is replaced with the server-confirmed todo (no flicker, no duplicate)

3. **Given** the optimistic update has been applied and the API call fails
   **When** the error is received
   **Then** the optimistic item is removed from the list, an error message is shown, and the input is restored with the typed text (NFR6)

4. **Given** Alex submits an empty input
   **When** the form validates
   **Then** the submit is blocked, no API call is made, and a validation message is shown inline

5. **Given** Alex adds a todo
   **When** the page is refreshed
   **Then** the todo is still present in the list (FR9, NFR5)

## Tasks / Subtasks

- [x] Task 1: Add `createTodo` to `frontend/src/api/todos.ts` (AC: #1, #2, #3, #5)
  - [x] 1.1 Export `createTodo(body: { description: string; tags?: string[] }): Promise<Todo>` using `fetchApi` with `method: 'POST'` and JSON body

- [x] Task 2: Add `useCreateTodo` composable to `frontend/src/composables/useTodos.ts` (AC: #1, #2, #3)
  - [x] 2.1 Implement `useCreateTodo(filters: Ref<TodoFilters>)` using `useMutation` from `@tanstack/vue-query`
  - [x] 2.2 `onMutate`: cancel all todo queries, snapshot current cache, prepend optimistic `Todo` item with temp id (`temp-<uuid>`) and `status: 'draft'`
  - [x] 2.3 `onError`: restore cache snapshot from context
  - [x] 2.4 `onSettled`: `invalidateQueries({ queryKey: todoKeys.all })`
  - [x] 2.5 Return `{ mutate, isPending, isError, error }` from `useMutation`

- [x] Task 3: Create `frontend/src/components/TodoForm.vue` (AC: #1, #3, #4)
  - [x] 3.1 Local `description = ref('')` and `validationError = ref('')`
  - [x] 3.2 On submit: trim input — if empty, set `validationError` and return without emitting
  - [x] 3.3 On valid submit: clear input optimistically (`description.value = ''`), save text in `pendingDescription` for rollback, call `props.onSubmit(trimmedDescription)`
  - [x] 3.4 Watch `props.error` — if error becomes truthy, restore input from `pendingDescription`
  - [x] 3.5 Props: `onSubmit: (description: string) => void`, `isPending: boolean`, `error?: Error | null`
  - [x] 3.6 Submit on button click AND on `Enter` key in the input
  - [x] 3.7 Disable submit button while `isPending` is true; show loading indicator on button
  - [x] 3.8 Show `validationError` inline below the input when non-empty
  - [x] 3.9 ARIA: `aria-label="New todo description"` on input; `aria-live="polite"` on validation error span; `aria-disabled` on button when pending

- [x] Task 4: Update `frontend/src/views/HomeView.vue` to wire in `TodoForm` (AC: #1–#5)
  - [x] 4.1 Import and call `useCreateTodo(filters)` — get `{ mutate: createTodo, isPending: createPending, error: createError }`
  - [x] 4.2 Render `<TodoForm :on-submit="createTodo" :is-pending="createPending" :error="createError" />` above `<TodoList />`

- [x] Task 5: Write component tests for `TodoForm.vue` (AC: #3, #4)
  - [x] 5.1 Test: empty submit shows validation error and blocks submission
  - [x] 5.2 Test: valid submit calls `onSubmit` with trimmed description and clears input
  - [x] 5.3 Test: submit button is disabled when `isPending` is true
  - [x] 5.4 Test: when `error` prop changes to a truthy value, the input is restored with original text

## Dev Notes

### What Already Exists — Do Not Recreate

- `frontend/src/api/client.ts` — exports `fetchApi<T>(endpoint, options?: RequestInit)` and `ApiError`. Already sets `Content-Type: application/json` by default. **Do NOT add that header in `createTodo`** — it would be a no-op duplicate.
- `frontend/src/api/todos.ts` — exports `getTodos`. **Add `createTodo` here; do NOT create a new file.**
- `frontend/src/composables/useTodos.ts` — exports `todoKeys`, `useTodos`. **Add `useCreateTodo` here; do NOT create a new file.**
- `frontend/src/types/todo.ts` — exports `Todo`, `TodoStatus`, `PaginatedResponse<T>`, `TodoFilters`. All types already correct; do NOT modify unless a new type is genuinely needed.
- `frontend/src/stores/ui.ts` — exports `useUiStore` with `statusFilter`, `page`. Already wired into `HomeView`.
- `frontend/src/components/TodoList.vue`, `TodoItem.vue`, `StatusBadge.vue` — already exist; no changes needed.
- `backend/src/routes/todos.routes.ts` — `POST /api/todos` already exists; accepts `{ description: string, tags?: string[] }`, returns HTTP 201 with full `Todo` object.

### `createTodo` API Function

Add to `frontend/src/api/todos.ts` — the file already imports `fetchApi` and types:

```typescript
export async function createTodo(body: { description: string; tags?: string[] }): Promise<Todo> {
  return fetchApi<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
```

**Note:** `fetchApi` already sets `Content-Type: application/json` as a default header — do not set it again in the options. `body: JSON.stringify(body)` is all that is needed beyond `method: 'POST'`.

### `useCreateTodo` Composable

Add to `frontend/src/composables/useTodos.ts`. The file already imports `computed`, `useQuery`, `Ref`, `getTodos`, `TodoFilters`. Add the following imports at the top:

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createTodo } from '../api/todos.js'
import type { Todo, PaginatedResponse } from '../types/todo.js'
```

Then add the composable:

```typescript
export function useCreateTodo(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (description: string) => createTodo({ description }),
    onMutate: async (description) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      // Snapshot the current cache
      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      // Build optimistic item
      const optimisticTodo: Todo = {
        id: `temp-${crypto.randomUUID()}`,
        description,
        status: 'draft',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Prepend to the list (newest first — matches GET order by created_at desc)
      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: [optimisticTodo, ...previous.data],
          pagination: {
            ...previous.pagination,
            total: previous.pagination.total + 1,
          },
        })
      }

      // Return context for rollback
      return { previous }
    },
    onError: (_err, _vars, context) => {
      // Roll back to the snapshot
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.filtered(filters.value), context.previous)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
```

**CRITICAL — `queryKey: computed(...)` is only for `useQuery`, NOT for `useMutation`.** `useMutation` does not have a `queryKey`. The cache manipulation uses `queryClient.getQueryData` / `setQueryData` directly.

**The `todoKeys` factory is already exported** from this file — reuse it. Do NOT re-declare it.

### `TodoForm.vue` Component

Full implementation:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  onSubmit: (description: string) => void
  isPending: boolean
  error?: Error | null
}>()

const description = ref('')
const validationError = ref('')
let pendingDescription = ''

function handleSubmit() {
  const trimmed = description.value.trim()
  if (!trimmed) {
    validationError.value = 'Description is required.'
    return
  }
  validationError.value = ''
  pendingDescription = trimmed
  description.value = '' // Clear optimistically before API call
  props.onSubmit(trimmed)
}

// Restore input when API call fails
watch(
  () => props.error,
  (err) => {
    if (err && pendingDescription) {
      description.value = pendingDescription
      pendingDescription = ''
    }
  },
)
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="description"
      type="text"
      placeholder="What needs to be done?"
      aria-label="New todo description"
      :disabled="isPending"
    />
    <button type="submit" :aria-disabled="isPending" :disabled="isPending">
      {{ isPending ? 'Adding…' : 'Add' }}
    </button>
    <span v-if="validationError" aria-live="polite" role="alert">{{ validationError }}</span>
  </form>
</template>
```

**Key design decisions:**
- `description.value = ''` happens in `handleSubmit` BEFORE `props.onSubmit(trimmed)` — this is the optimistic clear
- `pendingDescription` is a plain variable (not a `ref`) — it's only used for rollback tracking, not for rendering
- The `watch` on `props.error` triggers the rollback of the input text when the mutation fails
- `@submit.prevent` handles both button click and Enter key press on the input — **no need to add a separate `@keydown.enter` handler**

### `HomeView.vue` Update

Add `useCreateTodo` and `TodoForm` to the existing wiring:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTodos, useCreateTodo } from '../composables/useTodos.js'
import { useUiStore } from '../stores/ui.js'
import TodoList from '../components/TodoList.vue'
import TodoForm from '../components/TodoForm.vue'
import type { TodoFilters } from '../types/todo.js'

const uiStore = useUiStore()

const filters = computed<TodoFilters>(() => ({
  ...(uiStore.statusFilter ? { status: uiStore.statusFilter } : {}),
  page: uiStore.page,
}))

const { isPending: listPending, isError: listError, error: listError_, data } = useTodos(filters)
const todos = computed(() => data.value?.data ?? [])

const { mutate: createTodo, isPending: createPending, error: createError } = useCreateTodo(filters)
</script>

<template>
  <main>
    <h1>Todos</h1>
    <TodoForm :on-submit="createTodo" :is-pending="createPending" :error="createError" />
    <TodoList :todos="todos" :is-pending="listPending" :is-error="listError" :error="listError_" />
  </main>
</template>
```

**Note on destructuring rename:** `listError_` is used to avoid shadowing. Prefer descriptive renames: `isPending: listIsPending`, `isError: listIsError`, `error: listErr`. Adjust to avoid shadowing in your actual implementation.

### Optimistic Update — Edge Cases

**What if the query cache is empty (first load or no todos yet)?**
`previous` will be `undefined` when the cache key has no data. The `if (previous)` guard in `onMutate` skips the optimistic prepend in that case — `invalidateQueries` in `onSettled` will fetch fresh data instead. This is acceptable behaviour; the list will briefly show the old state and then refetch with the new item.

**Duplicate prevention (AC #2):**
On `onSettled`, `invalidateQueries({ queryKey: todoKeys.all })` triggers a fresh `GET /api/todos` fetch. The server response will replace the optimistic item (identified by `temp-<uuid>` id) with the real item. Since `TodoItem` uses `:key="todo.id"`, Vue's diffing will update in-place without a visible flicker.

### Testing Pattern for `TodoForm`

Tests co-located at `frontend/src/components/__tests__/TodoForm.test.ts`. The component is a pure UI component — all mutations are injected via props. Use `@vue/test-utils` `mount`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TodoForm from '../TodoForm.vue'

describe('TodoForm', () => {
  it('shows validation error when submitting empty input', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false },
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Description is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with trimmed description and clears input', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false },
    })
    await wrapper.find('input').setValue('  Buy milk  ')
    await wrapper.find('form').trigger('submit')
    expect(onSubmit).toHaveBeenCalledWith('Buy milk')
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('disables submit button when isPending is true', () => {
    const wrapper = mount(TodoForm, {
      props: { onSubmit: vi.fn(), isPending: true },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('restores input when error prop changes to truthy', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false, error: null },
    })
    await wrapper.find('input').setValue('Restore me')
    await wrapper.find('form').trigger('submit') // clears input + stores pendingDescription
    // Simulate API error
    await wrapper.setProps({ error: new Error('API error') })
    expect(wrapper.find('input').element.value).toBe('Restore me')
  })
})
```

### Architecture Compliance

| Rule | Compliance |
|------|-----------|
| No manual `isLoading` boolean | Use `isPending` from `useMutation` |
| `todoKeys` factory for all cache keys | `todoKeys.all` for cancel/invalidate; `todoKeys.filtered(filters.value)` for get/set |
| Optimistic mutation pattern | `onMutate` → prepend + snapshot; `onError` → rollback; `onSettled` → invalidate |
| No direct `fetch` in components | API call in `api/todos.ts` → `fetchApi` |
| No barrel `index.ts` files | Import directly: `'../composables/useTodos.js'` |
| Tests co-located with source | `components/__tests__/TodoForm.test.ts` |
| Test file suffix | `.test.ts` |
| Accessibility on form elements | `aria-label`, `aria-live`, `aria-disabled`, `role="alert"` |
| TypeScript types for all props | `defineProps<{...}>()` with explicit types |

### Previous Story Learnings (2.2 → 2.3)

- `fetchApi` already sets `Content-Type: application/json` — callers must NOT duplicate this header
- `fetchApi` returns `{} as T` for 204 responses — createTodo returns 201, so this does not apply
- `queryKey` must be `computed()` in `useQuery` — this does NOT apply to `useMutation` (no queryKey on mutations)
- `@vue/test-utils` + Vitest: `wrapper.find('form').trigger('submit')` simulates form submission including `@submit.prevent`
- `error` prop from TanStack Query is typed as `Error | null` — match this in `TodoForm` props for consistency
- `TodoList` `error` prop is already `Error | null` after Story 2.2 code review (P1 patch) — use the same type

### Backend Contract Reference

`POST /api/todos` (already implemented in Story 2.1):

- **Request body:** `{ "description": string (1–500 chars, non-whitespace-only), "tags"?: string[] }`
- **Response 201:** Full `Todo` object: `{ id, description, status: "draft", tags: [], createdAt: ISO, updatedAt: ISO }`
- **Response 400:** `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }` on invalid input
- Tags default to `[]` if not provided
- `status` always `"draft"` on creation — cannot be overridden at create time

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Added `createTodo()` to `api/todos.ts` — POST with JSON body via `fetchApi`
- Added `useCreateTodo(filters)` to `composables/useTodos.ts` — full optimistic mutation with snapshot/rollback/invalidate
- Created `TodoForm.vue` — inline validation, optimistic clear, error-triggered restore, ARIA attributes
- Updated `HomeView.vue` — wires `useCreateTodo` + `TodoForm` above `TodoList`
- 18 tests passing (5 test files; 4 new `TodoForm` tests)

### File List

- `frontend/src/api/todos.ts` (modified — added `createTodo`)
- `frontend/src/composables/useTodos.ts` (modified — added `useCreateTodo`, `useMutation`, `useQueryClient` imports)
- `frontend/src/components/TodoForm.vue` (new)
- `frontend/src/components/__tests__/TodoForm.test.ts` (new)
- `frontend/src/views/HomeView.vue` (modified — wired `TodoForm` + `useCreateTodo`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Senior Developer Review (AI)

### Review Findings

**Patch findings:**

- [x] [Review][Patch] P1 — `useCreateTodo`: `onError` re-derives rollback key from live `filters.value` instead of the key captured in `onMutate` context. Fix: add `key` to the returned context object in `onMutate` and reuse `context.key` in `onError`. [`frontend/src/composables/useTodos.ts` lines 38–42]
- [x] [Review][Patch] P2 — `TodoForm.vue`: `aria-live="polite"` on the validation error span conflicts with `role="alert"` (which implies `aria-live="assertive"`). Remove `aria-live="polite"` — `role="alert"` alone is correct and sufficient. [`frontend/src/components/TodoForm.vue` line 46]
