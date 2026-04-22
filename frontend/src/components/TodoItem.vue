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
