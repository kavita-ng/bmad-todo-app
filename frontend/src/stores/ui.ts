import { defineStore } from 'pinia'
import type { TodoStatus } from '../types/todo.js'

export const useUiStore = defineStore('ui', {
  state: () => ({
    statusFilter: null as TodoStatus | null,
    page: 1,
  }),
  actions: {
    setStatusFilter(status: TodoStatus | null) {
      this.statusFilter = status
      this.page = 1
    },
    setPage(page: number) {
      this.page = page
    },
    resetFilters() {
      this.statusFilter = null
      this.page = 1
    },
  },
})
