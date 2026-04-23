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

const baseProps = {
  todos: [] as Todo[],
  isPending: false,
  isError: false,
  onDelete: vi.fn(),
  deletingId: null,
  onStatusChange: vi.fn(),
  updatingStatusId: null,
}

describe('TodoList', () => {
  it('shows loading state when isPending is true', () => {
    const wrapper = mount(TodoList, {
      props: { ...baseProps, isPending: true },
    })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('shows error state when isError is true', () => {
    const wrapper = mount(TodoList, {
      props: { ...baseProps, isError: true },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows empty state when todos array is empty and not loading/error', () => {
    const wrapper = mount(TodoList, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('No todos yet')
  })

  it('renders list items when todos are provided', () => {
    const wrapper = mount(TodoList, {
      props: { ...baseProps, todos: [baseTodo] },
    })
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Write tests')
  })

  it('passes onDelete and isDeleting props to TodoItem', () => {
    const onDelete = vi.fn()
    const wrapper = mount(TodoList, {
      props: {
        ...baseProps,
        todos: [baseTodo],
        onDelete,
        deletingId: baseTodo.id,
      },
    })
    const item = wrapper.findComponent({ name: 'TodoItem' })
    expect(item.props('isDeleting')).toBe(true)
    item.props('onDelete')()
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
