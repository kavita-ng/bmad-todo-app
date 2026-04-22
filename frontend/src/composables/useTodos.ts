import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { getTodos, createTodo } from '../api/todos.js'
import type { Todo, TodoFilters, PaginatedResponse } from '../types/todo.js'

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

export function useCreateTodo(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (description: string) => createTodo({ description }),
    onMutate: async (description) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      const optimisticTodo: Todo = {
        id: `temp-${crypto.randomUUID()}`,
        description,
        status: 'draft',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: [optimisticTodo, ...previous.data],
          pagination: {
            ...previous.pagination,
            total: previous.pagination.total + 1,
          },
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.filtered(filters.value), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
