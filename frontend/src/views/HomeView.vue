<script setup lang="ts">
import { computed } from 'vue'
import { useTodos } from '../composables/useTodos.js'
import { useUiStore } from '../stores/ui.js'
import TodoList from '../components/TodoList.vue'
import type { TodoFilters } from '../types/todo.js'

const uiStore = useUiStore()

const filters = computed<TodoFilters>(() => ({
  ...(uiStore.statusFilter ? { status: uiStore.statusFilter } : {}),
  page: uiStore.page,
}))

const { isPending, isError, error, data } = useTodos(filters)
const todos = computed(() => data.value?.data ?? [])
</script>

<template>
  <main>
    <h1>Todos</h1>
    <TodoList :todos="todos" :is-pending="isPending" :is-error="isError" :error="error" />
  </main>
</template>
