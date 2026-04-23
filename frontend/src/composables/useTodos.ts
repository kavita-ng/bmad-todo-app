import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { getTodos, createTodo, deleteTodo, patchTodoStatus } from '../api/todos.js'
import type { Todo, TodoStatus, TodoFilters, PaginatedResponse } from '../types/todo.js'

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

      return { previous, key }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export function useDeleteTodo(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: previous.data.filter((t) => t.id !== id),
          pagination: {
            ...previous.pagination,
            total: Math.max(0, previous.pagination.total - 1),
          },
        })
      }

      return { previous, key }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export function useUpdateTodoStatus(filters: Ref<TodoFilters>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) => patchTodoStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const key = todoKeys.filtered(filters.value)
      const previous = queryClient.getQueryData<PaginatedResponse<Todo>>(key)

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<Todo>>(key, {
          ...previous,
          data: previous.data.map((t) => (t.id === id ? { ...t, status } : t)),
        })
      }

      return { previous, key }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
