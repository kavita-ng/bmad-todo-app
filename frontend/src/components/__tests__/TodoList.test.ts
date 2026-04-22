import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TodoList from '../TodoList.vue'
import type { Todo } from '../../types/todo.js'

const baseTodo: Todo = {
  id: '1',
  description: 'Write tests',
  status: 'ready',
  tags: [],
  createdAt: '2026-04-22T10:00:00.000Z',
  updatedAt: '2026-04-22T10:00:00.000Z',
}

describe('TodoList', () => {
  it('shows loading state when isPending is true', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: true, isError: false, onDelete: vi.fn(), deletingId: null },
    })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('shows error state when isError is true', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: false, isError: true, onDelete: vi.fn(), deletingId: null },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows empty state when todos array is empty and not loading/error', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [], isPending: false, isError: false, onDelete: vi.fn(), deletingId: null },
    })
    expect(wrapper.text()).toContain('No todos yet')
  })

  it('renders list items when todos are provided', () => {
    const wrapper = mount(TodoList, {
      props: {
        todos: [baseTodo],
        isPending: false,
        isError: false,
        onDelete: vi.fn(),
        deletingId: null,
      },
    })
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Write tests')
  })
})
