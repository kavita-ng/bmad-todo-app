import { fetchApi } from './client.js'
import type { Todo, TodoStatus, TodoFilters, PaginatedResponse } from '../types/todo.js'

export async function getTodos(filters: TodoFilters = {}): Promise<PaginatedResponse<Todo>> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  const query = params.toString()
  return fetchApi<PaginatedResponse<Todo>>(`/api/todos${query ? `?${query}` : ''}`)
}

export async function createTodo(body: { description: string; tags?: string[] }): Promise<Todo> {
  return fetchApi<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteTodo(id: string): Promise<void> {
  await fetchApi<void>(`/api/todos/${id}`, { method: 'DELETE' })
}

export async function patchTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  return fetchApi<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
