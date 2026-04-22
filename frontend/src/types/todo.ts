export type TodoStatus = 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'

export interface Todo {
  id: string
  description: string
  status: TodoStatus
  tags: string[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface TodoFilters {
  status?: TodoStatus
  page?: number
  limit?: number
}
