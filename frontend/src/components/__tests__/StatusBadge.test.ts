import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StatusBadge from '../StatusBadge.vue'
import type { TodoStatus } from '../../types/todo.js'

const cases: Array<[TodoStatus, string]> = [
  ['draft', 'Draft'],
  ['ready', 'Ready'],
  ['in_progress', 'In Progress'],
  ['backlog', 'Backlog'],
  ['completed', 'Completed'],
]

const activeCases: TodoStatus[] = ['draft', 'ready', 'in_progress']
const terminalCases: TodoStatus[] = ['backlog', 'completed']

describe('StatusBadge', () => {
  it.each(cases)('renders "%s" as "%s"', (status, label) => {
    const wrapper = mount(StatusBadge, { props: { status } })
    expect(wrapper.text()).toBe(label)
  })

  it.each(activeCases)('active status "%s" renders with font-medium class', (status) => {
    const wrapper = mount(StatusBadge, { props: { status } })
    expect(wrapper.find('span').classes()).toContain('font-medium')
  })

  it.each(terminalCases)('terminal status "%s" renders with font-normal class', (status) => {
    const wrapper = mount(StatusBadge, { props: { status } })
    expect(wrapper.find('span').classes()).toContain('font-normal')
  })
})
