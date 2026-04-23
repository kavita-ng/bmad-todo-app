<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { useTodos, useCreateTodo, useDeleteTodo, useUpdateTodoStatus } from '../composables/useTodos.js'
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

const { mutate: createTodo, isPending: createPending, isSuccess: createSuccess, error: createErr } = useCreateTodo(filters)
const { mutate: deleteTodo, variables: deletingId, isSuccess: deleteSuccess, error: deleteErr } = useDeleteTodo(filters)
const { mutate: updateStatus, variables: updatingStatusVars, isSuccess: updateSuccess, error: updateStatusErr } = useUpdateTodoStatus(filters)
const updatingStatusId = computed(() => updatingStatusVars.value?.id ?? null)

const liveMessage = ref('')
watch(createSuccess, async (val) => {
  if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Todo added' }
})
watch(deleteSuccess, async (val) => {
  if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Todo deleted' }
})
watch(updateSuccess, async (val) => {
  if (val) { liveMessage.value = ''; await nextTick(); liveMessage.value = 'Status updated' }
})
</script>

<template>
  <main class="mx-auto max-w-2xl w-full px-4 sm:px-6 py-8">
    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">{{ liveMessage }}</div>
    <h1 class="text-2xl font-bold text-slate-800 mb-6">Todos</h1>
    <TodoForm :on-submit="createTodo" :is-pending="createPending" :error="createErr" />
    <div v-if="deleteErr" role="alert" class="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{{ deleteErr.message }}</div>
    <div v-if="updateStatusErr" role="alert" class="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{{ updateStatusErr.message }}</div>
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
  </main>
</template>
