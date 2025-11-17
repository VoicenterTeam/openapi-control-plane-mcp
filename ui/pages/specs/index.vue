<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">API Specifications</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage and explore your OpenAPI specifications
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
          <button
            @click="refreshSpecs"
            class="px-4 py-2 bg-voicenter-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
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
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No specs found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'Try a different search query' : 'Get started by adding your first API specification' }}
          </p>
        </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { specs, loading, error, fetchSpecs, searchSpecs } = useSpecs()

const searchQuery = ref('')

// Fetch specs on mount
onMounted(() => {
  fetchSpecs()
})

// Filtered specs based on search
const filteredSpecs = computed(() => {
  if (!searchQuery.value) return specs.value
  return searchSpecs(searchQuery.value)
})

// Refresh specs
function refreshSpecs() {
  fetchSpecs()
}

// Navigate to spec detail
function navigateToSpec(apiId: string) {
  router.push(`/specs/${apiId}`)
}

useHead({
  title: 'API Specifications',
})
</script>

