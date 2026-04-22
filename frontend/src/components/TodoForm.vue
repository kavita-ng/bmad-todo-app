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
  <form @submit.prevent="handleSubmit">
    <input
      v-model="description"
      type="text"
      placeholder="What needs to be done?"
      aria-label="New todo description"
      :disabled="isPending"
    />
    <button type="submit" :aria-disabled="isPending" :disabled="isPending">
      {{ isPending ? 'Adding…' : 'Add' }}
    </button>
    <span v-if="validationError" role="alert">{{ validationError }}</span>
  </form>
</template>
