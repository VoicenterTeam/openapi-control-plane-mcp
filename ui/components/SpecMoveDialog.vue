<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Move Spec to Folder</h3>
      </template>

      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Move <strong>{{ apiId }}</strong> to a different workspace
          </p>
        </div>

        <div v-if="foldersLoading" class="space-y-2">
          <USkeleton class="h-12 w-full" v-for="i in 3" :key="i" />
        </div>

        <div v-else-if="foldersError" class="text-red-500 text-sm">
          {{ foldersError }}
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="folder in sortedFolders"
            :key="folder.name"
            class="folder-option"
            :class="{ selected: selectedFolder === folder.name, disabled: folder.name === currentFolder }"
            @click="selectFolder(folder.name)"
            :disabled="folder.name === currentFolder || moving"
          >
            <div class="folder-icon" :style="{ backgroundColor: folder.color || '#6b7280' }">
              <UIcon :name="`i-heroicons-${folder.icon || 'folder'}`" class="w-4 h-4" />
            </div>
            <div class="folder-info">
              <div class="folder-title">{{ folder.title }}</div>
              <div class="folder-hint">
                <span v-if="folder.name === currentFolder" class="text-xs text-gray-500">Current location</span>
                <span v-else class="text-xs text-gray-500">{{ folder.spec_count || 0 }} specs</span>
              </div>
            </div>
            <UIcon v-if="selectedFolder === folder.name" name="i-heroicons-check" class="w-5 h-5 text-primary" />
          </button>
        </div>

        <div v-if="moveError" class="text-red-500 text-sm">
          {{ moveError }}
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="closeDialog"
            :disabled="moving"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="handleMove"
            :loading="moving"
            :disabled="!selectedFolder || selectedFolder === currentFolder"
          >
            Move Spec
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  apiId: string
  currentFolder: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'moved': []
}>()

const { folders, loading: foldersLoading, error: foldersError, fetchFolders, moveSpec, sortedFolders } = useFolders()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedFolder = ref<string>('')
const moving = ref(false)
const moveError = ref<string | null>(null)

// Fetch folders when dialog opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await fetchFolders()
    selectedFolder.value = ''
    moveError.value = null
  }
})

function selectFolder(folderName: string) {
  if (folderName !== props.currentFolder) {
    selectedFolder.value = folderName
    moveError.value = null
  }
}

async function handleMove() {
  if (!selectedFolder.value || selectedFolder.value === props.currentFolder) {
    return
  }

  moving.value = true
  moveError.value = null

  try {
    const result = await moveSpec(props.apiId, selectedFolder.value)
    
    if (result.success) {
      emit('moved')
      closeDialog()
    } else {
      moveError.value = result.error || 'Failed to move spec'
    }
  } catch (err: any) {
    moveError.value = err.message
  } finally {
    moving.value = false
  }
}

function closeDialog() {
  isOpen.value = false
  selectedFolder.value = ''
  moveError.value = null
}
</script>

<style scoped>
.folder-option {
  @apply flex items-center gap-3 w-full p-3 rounded-lg transition-colors;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply border border-transparent;
}

.folder-option.selected {
  @apply bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800;
}

.folder-option.disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-transparent;
}

.folder-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0;
}

.folder-info {
  @apply flex-1 min-w-0;
}

.folder-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}

.folder-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style>

