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

describe('StatusBadge', () => {
  it.each(cases)('renders "%s" as "%s"', (status, label) => {
    const wrapper = mount(StatusBadge, { props: { status } })
    expect(wrapper.text()).toBe(label)
  })
})
