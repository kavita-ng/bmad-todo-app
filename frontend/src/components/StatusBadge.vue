<script setup lang="ts">
import type { TodoStatus } from '../types/todo.js'

const props = defineProps<{
  status: TodoStatus
}>()

const STATUS_LABELS: Record<TodoStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  backlog: 'Backlog',
  completed: 'Completed',
}

const STATUS_CLASSES: Record<TodoStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 font-medium',
  ready: 'bg-blue-100 text-blue-700 font-medium',
  in_progress: 'bg-amber-100 text-amber-700 font-medium',
  backlog: 'bg-gray-100 text-gray-400 font-normal',
  completed: 'bg-green-100 text-green-500 font-normal',
}
</script>

<template>
  <span
    :data-status="props.status"
    :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs', STATUS_CLASSES[props.status]]"
  >
    {{ STATUS_LABELS[props.status] }}
  </span>
</template>
