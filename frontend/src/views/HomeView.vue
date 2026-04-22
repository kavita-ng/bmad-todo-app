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

const { isPending: listPending, isError: listIsError, error: listErr, data } = useTodos(filters)
const todos = computed(() => data.value?.data ?? [])

const { mutate: createTodo, isPending: createPending, error: createErr } = useCreateTodo(filters)
</script>

<template>
  <main>
    <h1>Todos</h1>
    <TodoForm :on-submit="createTodo" :is-pending="createPending" :error="createErr" />
    <TodoList :todos="todos" :is-pending="listPending" :is-error="listIsError" :error="listErr" />
  </main>
</template>
