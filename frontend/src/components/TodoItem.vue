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
  <div class="flex flex-col gap-2 py-4">
    <p class="text-sm text-slate-800 break-words">{{ props.todo.description }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <StatusBadge :status="props.todo.status" />
      <select
        aria-label="Change status"
        :value="props.todo.status"
        :disabled="isUpdatingStatus"
        :aria-disabled="isUpdatingStatus"
        class="min-h-[44px] rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        @change="props.onStatusChange(($event.target as HTMLSelectElement).value as TodoStatus)"
      >
        <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <button
        type="button"
        aria-label="Delete todo"
        :aria-disabled="isDeleting"
        :disabled="isDeleting"
        class="min-h-[44px] min-w-[44px] shrink-0 rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        @click="props.onDelete()"
      >
        {{ isDeleting ? 'Deleting…' : 'Delete' }}
      </button>
      <time :datetime="props.todo.createdAt" class="text-xs text-slate-400">{{ formatDate(props.todo.createdAt) }}</time>
    </div>
    <ul v-if="props.todo.tags.length > 0" class="flex flex-wrap gap-1">
      <li v-for="tag in props.todo.tags" :key="tag" class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ tag }}</li>
    </ul>
  </div>
</template>
