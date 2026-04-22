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
</script>

<template>
  <span>{{ STATUS_LABELS[props.status] }}</span>
</template>
