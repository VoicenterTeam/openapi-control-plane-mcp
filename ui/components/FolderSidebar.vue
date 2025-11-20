<template>
  <div class="folder-sidebar">
    <div class="folder-sidebar-header">
      <h2 class="text-lg font-semibold">Workspaces</h2>
      <UButton 
        icon="i-heroicons-plus" 
        size="xs" 
        color="primary" 
        variant="ghost"
        @click="showCreateModal = true"
      />
    </div>

    <div v-if="loading" class="p-4">
      <USkeleton class="h-10 w-full mb-2" v-for="i in 3" :key="i" />
    </div>

    <div v-else-if="error" class="p-4 text-red-500 text-sm">
      {{ error }}
    </div>

    <div v-else class="folder-list">
      <button
        v-for="folder in sortedFolders"
        :key="folder.name"
        class="folder-item"
        :class="{ active: currentFolder === folder.name }"
        @click="selectFolder(folder.name)"
      >
        <div class="folder-icon" :style="{ backgroundColor: folder.color || '#6b7280' }">
          <UIcon :name="`i-heroicons-${folder.icon || 'folder'}`" class="w-4 h-4" />
        </div>
        <div class="folder-info">
          <div class="folder-title">{{ folder.title }}</div>
          <div class="folder-count">{{ folder.spec_count || 0 }} specs</div>
        </div>
      </button>
    </div>

    <!-- Create Folder Modal -->
    <FolderCreateModal v-model="showCreateModal" @created="handleFolderCreated" />
  </div>
</template>

<script setup lang="ts">
const { folders, currentFolder, loading, error, fetchFolders, setCurrentFolder, sortedFolders } = useFolders()
const showCreateModal = ref(false)

const emit = defineEmits<{
  folderSelected: [folderName: string]
}>()

// Fetch folders on mount and emit the persisted folder
onMounted(async () => {
  await fetchFolders()
  // Emit the current folder (loaded from localStorage) so specs list updates
  if (currentFolder.value) {
    emit('folderSelected', currentFolder.value)
  }
})

function selectFolder(folderName: string) {
  setCurrentFolder(folderName)
  emit('folderSelected', folderName)
}

async function handleFolderCreated() {
  await fetchFolders()
}
</script>

<style scoped>
.folder-sidebar {
  @apply flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800;
}

.folder-sidebar-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800;
}

.folder-list {
  @apply flex-1 overflow-y-auto p-2;
}

.folder-item {
  @apply flex items-center gap-3 w-full p-3 rounded-lg transition-colors;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
}

.folder-item.active {
  @apply bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800;
}

.folder-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0;
}

.folder-info {
  @apply flex-1 min-w-0;
}

.folder-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 truncate;
}

.folder-count {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style>

