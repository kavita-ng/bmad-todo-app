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

const STATUS_OPTIONS: Array<{ value: TodoStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'completed', label: 'Completed' },
]

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
