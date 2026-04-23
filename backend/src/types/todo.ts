export type TodoStatus = 'draft' | 'ready' | 'in_progress' | 'backlog' | 'completed'

export interface Todo {
  id: string
  description: string
  status: TodoStatus
  tags: string[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface CreateTodoBody {
  description: string
  tags?: string[]
}

export interface UpdateTodoBody {
  status?: TodoStatus
  description?: string
  tags?: string[]
}

export interface PatchTodoBody {
  status: TodoStatus;
}
