<script setup lang="ts">
import type { Todo, TodoStatus } from '../types/todo.js'
import TodoItem from './TodoItem.vue'

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
</script>

<template>
  <div v-if="isPending" role="status" aria-label="Loading todos" class="py-8 text-center text-slate-500">Loading…</div>
  <div v-else-if="isError" role="alert" class="rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error?.message || 'Failed to load todos. Please try again.' }}</div>
  <p v-else-if="todos.length === 0" class="py-8 text-center text-slate-500">No todos yet. Add your first todo above.</p>
  <ul v-else aria-label="Todo list" class="divide-y divide-slate-100">
    <li v-for="todo in todos" :key="todo.id">
      <TodoItem
        :todo="todo"
        :on-delete="() => onDelete(todo.id)"
        :is-deleting="deletingId === todo.id"
        :on-status-change="(status) => onStatusChange(todo.id, status)"
        :is-updating-status="updatingStatusId === todo.id"
      />
    </li>
  </ul>
</template>
