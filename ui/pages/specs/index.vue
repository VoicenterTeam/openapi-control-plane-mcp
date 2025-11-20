<template>
  <div class="specs-page">
    <!-- Folder Sidebar -->
    <div class="sidebar">
      <FolderSidebar @folder-selected="handleFolderSelected" />
    </div>

    <!-- Main Content Area -->
    <div class="content">
      <!-- Page Header with breadcrumb -->
      <div class="mb-8">
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Workspaces</span>
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 mx-1" />
          <span class="text-gray-900 dark:text-white font-medium">{{ activeFolderMetadata?.title || currentFolder }}</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ activeFolderMetadata?.title || currentFolder }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ activeFolderMetadata?.description || 'Manage your OpenAPI specifications' }}
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search specs by name, owner, or tags..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <UButton
          icon="i-heroicons-arrow-path"
          @click="refreshSpecs"
          color="primary"
        >
          Refresh
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-voicenter-primary"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Specs Grid -->
      <div v-else-if="filteredSpecs.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SpecCard 
          v-for="spec in filteredSpecs" 
          :key="spec.api_id"
          :spec="spec"
          @click="navigateToSpec(spec.api_id)"
          @moved="handleSpecMoved"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No specs found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery ? 'Try a different search query' : 'This workspace is empty' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { specs, currentFolder, loading, error, fetchSpecsInFolder, searchSpecs } = useSpecs()
const { activeFolderMetadata } = useFolders()

const searchQuery = ref('')

// Fetch specs on mount (from active folder by default)
onMounted(async () => {
  await fetchSpecsInFolder('active')
})

// Filtered specs based on search
const filteredSpecs = computed(() => {
  if (!searchQuery.value) return specs.value
  return searchSpecs(searchQuery.value)
})

// Handle folder selection from sidebar
async function handleFolderSelected(folderName: string) {
  searchQuery.value = ''
  await fetchSpecsInFolder(folderName)
}

// Refresh specs in current folder
async function refreshSpecs() {
  await fetchSpecsInFolder(currentFolder.value)
}

// Handle spec moved event
async function handleSpecMoved() {
  await refreshSpecs()
}

// Navigate to spec detail
function navigateToSpec(apiId: string) {
  router.push(`/specs/${apiId}`)
}

useHead({
  title: 'API Specifications',
})
</script>

<style scoped>
.specs-page {
  @apply flex h-full min-h-screen -mx-6 -my-6;
}

.sidebar {
  @apply w-64 flex-shrink-0;
}

.content {
  @apply flex-1 p-6 overflow-y-auto;
}
</style>

