<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Create New Workspace</h3>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormGroup label="Name" required help="Lowercase, alphanumeric, hyphens only">
          <UInput
            v-model="form.name"
            placeholder="my-workspace"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Title" required>
          <UInput
            v-model="form.title"
            placeholder="My Workspace"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Description">
          <UTextarea
            v-model="form.description"
            placeholder="Description of this workspace..."
            :rows="3"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Color">
          <div class="flex gap-2">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              class="color-button"
              :class="{ selected: form.color === color }"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
              :disabled="loading"
            />
          </div>
        </UFormGroup>

        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="closeModal"
            :disabled="loading"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="handleSubmit"
            :loading="loading"
          >
            Create Workspace
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': []
}>()

const { createFolder } = useFolders()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  name: '',
  title: '',
  description: '',
  color: '#10b981',
  icon: 'folder'
})

const colors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#6366f1', // indigo
]

const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  // Validate name format
  const namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
  if (!form.value.name || !namePattern.test(form.value.name)) {
    error.value = 'Name must be lowercase, alphanumeric, and use hyphens only'
    return
  }

  if (!form.value.title) {
    error.value = 'Title is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await createFolder(form.value)
    
    if (result.success) {
      emit('created')
      closeModal()
      resetForm()
    } else {
      error.value = result.error || 'Failed to create workspace'
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function closeModal() {
  isOpen.value = false
  resetForm()
}

function resetForm() {
  form.value = {
    name: '',
    title: '',
    description: '',
    color: '#10b981',
    icon: 'folder'
  }
  error.value = null
}
</script>

<style scoped>
.color-button {
  @apply w-10 h-10 rounded-lg border-2 border-transparent transition-all;
  @apply hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed;
}

.color-button.selected {
  @apply border-gray-900 dark:border-white scale-110;
}
</style>

