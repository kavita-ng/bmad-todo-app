import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TodoForm from '../TodoForm.vue'

describe('TodoForm', () => {
  it('shows validation error and blocks submission when input is empty', async () => {
    const onSubmit = vi.fn<(description: string) => void>()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false },
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Description is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with trimmed description and clears input on valid submit', async () => {
    const onSubmit = vi.fn<(description: string) => void>()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false },
    })
    await wrapper.find('input').setValue('  Buy milk  ')
    await wrapper.find('form').trigger('submit')
    expect(onSubmit).toHaveBeenCalledWith('Buy milk')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('disables submit button when isPending is true', () => {
    const wrapper = mount(TodoForm, {
      props: { onSubmit: vi.fn<(description: string) => void>(), isPending: true },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('restores input when error prop changes to truthy after submit', async () => {
    const onSubmit = vi.fn<(description: string) => void>()
    const wrapper = mount(TodoForm, {
      props: { onSubmit, isPending: false, error: null },
    })
    await wrapper.find('input').setValue('Restore me')
    await wrapper.find('form').trigger('submit')
    // Input cleared optimistically
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
    // Simulate API error arriving
    await wrapper.setProps({ error: new Error('API error') })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Restore me')
  })
})
