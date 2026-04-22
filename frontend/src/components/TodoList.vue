<script setup lang="ts">
import type { Todo } from '../types/todo.js'
import TodoItem from './TodoItem.vue'

defineProps<{
  todos: Todo[]
  isPending: boolean
  isError: boolean
  error?: Error | null
}>()
</script>

<template>
  <div v-if="isPending" role="status" aria-label="Loading todos">Loading…</div>
  <div v-else-if="isError" role="alert">{{ error?.message || 'Failed to load todos. Please try again.' }}</div>
  <p v-else-if="todos.length === 0">No todos yet. Add your first todo above.</p>
  <ul v-else aria-label="Todo list">
    <li v-for="todo in todos" :key="todo.id">
      <TodoItem :todo="todo" />
    </li>
  </ul>
</template>
