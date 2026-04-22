import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TodoItem from '../TodoItem.vue'
import type { Todo } from '../../types/todo.js'

const todo: Todo = {
  id: '1',
  description: 'Buy groceries',
  status: 'in_progress',
  tags: ['errands', 'personal'],
  createdAt: '2026-04-22T10:00:00.000Z',
  updatedAt: '2026-04-22T10:00:00.000Z',
}

describe('TodoItem', () => {
  it('renders the description', () => {
    const wrapper = mount(TodoItem, { props: { todo } })
    expect(wrapper.text()).toContain('Buy groceries')
  })

  it('renders the status label via StatusBadge', () => {
    const wrapper = mount(TodoItem, { props: { todo } })
    expect(wrapper.text()).toContain('In Progress')
  })

  it('renders a human-readable created date', () => {
    const wrapper = mount(TodoItem, { props: { todo } })
    // Apr 22, 2026 (en-US locale)
    expect(wrapper.find('time').exists()).toBe(true)
    expect(wrapper.find('time').attributes('datetime')).toBe('2026-04-22T10:00:00.000Z')
    expect(wrapper.find('time').text()).toMatch(/Apr\s+22,\s+2026/)
  })

  it('renders tags when present', () => {
    const wrapper = mount(TodoItem, { props: { todo } })
    expect(wrapper.text()).toContain('errands')
    expect(wrapper.text()).toContain('personal')
  })
})
