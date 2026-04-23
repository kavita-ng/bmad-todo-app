<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  onSubmit: (description: string) => void
  isPending: boolean
  error?: Error | null
}>()

const description = ref('')
const validationError = ref('')
let pendingDescription = ''

function handleSubmit() {
  const trimmed = description.value.trim()
  if (!trimmed) {
    validationError.value = 'Description is required.'
    return
  }
  validationError.value = ''
  pendingDescription = trimmed
  description.value = ''
  props.onSubmit(trimmed)
}

watch(
  () => props.error,
  (err) => {
    if (err && pendingDescription) {
      description.value = pendingDescription
      pendingDescription = ''
    }
  },
)
</script>

<template>
  <form @submit.prevent="handleSubmit" class="mb-6">
    <div class="flex gap-2">
      <input
        v-model="description"
        type="text"
        placeholder="What needs to be done?"
        aria-label="New todo description"
        :disabled="isPending"
        class="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        :aria-disabled="isPending"
        :disabled="isPending"
        class="min-h-[44px] min-w-[44px] shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {{ isPending ? 'Adding…' : 'Add' }}
      </button>
    </div>
    <span v-if="validationError" role="alert" class="mt-1 block text-xs text-red-600">{{ validationError }}</span>
  </form>
</template>
