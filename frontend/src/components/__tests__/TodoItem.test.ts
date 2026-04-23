import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TodoItem from '../TodoItem.vue'
import type { Todo, TodoStatus } from '../../types/todo.js'

const todo: Todo = {
  id: '1',
  description: 'Buy groceries',
  status: 'in_progress',
  tags: ['errands', 'personal'],
  createdAt: '2026-04-22T10:00:00.000Z',
  updatedAt: '2026-04-22T10:00:00.000Z',
}

const baseProps = {
  todo,
  onDelete: vi.fn<() => void>(),
  isDeleting: false,
  onStatusChange: vi.fn<(status: TodoStatus) => void>(),
  isUpdatingStatus: false,
}

describe('TodoItem', () => {
  it('renders the description', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    expect(wrapper.text()).toContain('Buy groceries')
  })

  it('renders the status label via StatusBadge', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    expect(wrapper.text()).toContain('In Progress')
  })

  it('renders a human-readable created date', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    // Apr 22, 2026 (en-US locale)
    expect(wrapper.find('time').exists()).toBe(true)
    expect(wrapper.find('time').attributes('datetime')).toBe('2026-04-22T10:00:00.000Z')
    expect(wrapper.find('time').text()).toMatch(/Apr\s+22,\s+2026/)
  })

  it('renders tags when present', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    expect(wrapper.text()).toContain('errands')
    expect(wrapper.text()).toContain('personal')
  })

  it('renders a delete button', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    expect(wrapper.find('button[aria-label="Delete todo"]').exists()).toBe(true)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn<() => void>()
    const wrapper = mount(TodoItem, { props: { ...baseProps, onDelete } })
    await wrapper.find('button[aria-label="Delete todo"]').trigger('click')
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('disables delete button when isDeleting is true', () => {
    const wrapper = mount(TodoItem, { props: { ...baseProps, isDeleting: true } })
    expect(wrapper.find('button[aria-label="Delete todo"]').attributes('disabled')).toBeDefined()
  })

  it('renders a select with 5 status options', () => {
    const wrapper = mount(TodoItem, { props: baseProps })
    expect(wrapper.find('select[aria-label="Change status"]').exists()).toBe(true)
    expect(wrapper.findAll('option')).toHaveLength(5)
  })

  it('calls onStatusChange when select changes', async () => {
    const onStatusChange = vi.fn<(status: TodoStatus) => void>()
    const wrapper = mount(TodoItem, { props: { ...baseProps, onStatusChange } })
    await wrapper.find('select').setValue('ready')
    expect(onStatusChange).toHaveBeenCalledWith('ready')
  })

  it('disables select when isUpdatingStatus is true', () => {
    const wrapper = mount(TodoItem, { props: { ...baseProps, isUpdatingStatus: true } })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })
})
