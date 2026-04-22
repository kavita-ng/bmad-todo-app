import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { getTodos } from '../api/todos.js'
import type { TodoFilters } from '../types/todo.js'

export const todoKeys = {
  all: ['todos'] as const,
  filtered: (filters: TodoFilters) => ['todos', filters] as const,
}

export function useTodos(filters: Ref<TodoFilters>) {
  return useQuery({
    queryKey: computed(() => todoKeys.filtered(filters.value)),
    queryFn: () => getTodos(filters.value),
  })
}
