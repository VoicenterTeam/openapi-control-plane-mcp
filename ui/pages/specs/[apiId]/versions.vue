<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <NuxtLink to="/specs" class="hover:text-voicenter-primary">Specs</NuxtLink>
        <span>/</span>
        <NuxtLink :to="`/specs/${apiId}`" class="hover:text-voicenter-primary">{{ apiId }}</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 dark:text-white">Versions</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Version History</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        All versions for {{ apiId }}
      </p>
    </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-voicenter-primary"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Versions List -->
        <div v-else-if="sortedVersions.length > 0" class="space-y-4">
          <div 
            v-for="version in sortedVersions" 
            :key="version.version"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center space-x-3">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ version.version }}
                  </h3>
                  <VersionBadge :version="version.version" current />
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ version.description }}
                </p>
              </div>
            </div>

            <!-- Version Metadata -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">Created by</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ version.created_by }}</p>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Created</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(version.created_at) }}</p>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Endpoints</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ version.stats.endpoint_count }}</p>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Schemas</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ version.stats.schema_count }}</p>
              </div>
            </div>

            <!-- Changes Summary -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Changes</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div v-if="version.changes.endpoints_added.length > 0">
                  <span class="text-voicenter-success font-medium">
                    +{{ version.changes.endpoints_added.length }} Endpoints
                  </span>
                  <ul class="mt-1 space-y-1">
                    <li v-for="(endpoint, idx) in version.changes.endpoints_added.slice(0, 3)" :key="idx" class="text-gray-600 dark:text-gray-400 text-xs">
                      {{ endpoint }}
                    </li>
                  </ul>
                </div>
                <div v-if="version.changes.endpoints_modified.length > 0">
                  <span class="text-voicenter-warning font-medium">
                    ~{{ version.changes.endpoints_modified.length }} Modified
                  </span>
                  <ul class="mt-1 space-y-1">
                    <li v-for="(endpoint, idx) in version.changes.endpoints_modified.slice(0, 3)" :key="idx" class="text-gray-600 dark:text-gray-400 text-xs">
                      {{ endpoint }}
                    </li>
                  </ul>
                </div>
                <div v-if="version.changes.endpoints_deleted.length > 0">
                  <span class="text-voicenter-destructive font-medium">
                    -{{ version.changes.endpoints_deleted.length}} Deleted
                  </span>
                  <ul class="mt-1 space-y-1">
                    <li v-for="(endpoint, idx) in version.changes.endpoints_deleted.slice(0, 3)" :key="idx" class="text-gray-600 dark:text-gray-400 text-xs">
                      {{ endpoint }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Breaking Changes Alert -->
              <div v-if="version.changes.breaking_changes.length > 0" class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-red-800 dark:text-red-200">Breaking Changes</p>
                    <ul class="mt-1 text-xs text-red-700 dark:text-red-300 list-disc list-inside">
                      <li v-for="(change, idx) in version.changes.breaking_changes" :key="idx">
                        {{ change }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
              <NuxtLink 
                :to="`/specs/${apiId}?version=${version.version}`"
                class="px-4 py-2 bg-voicenter-primary text-white rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                View Spec
              </NuxtLink>
              <button class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                Compare
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No versions found</h3>
        </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const apiId = route.params.apiId as string

const { versions, loading, error, sortedVersions, fetchVersions } = useVersions(apiId)

onMounted(() => {
  fetchVersions()
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

useHead({
  title: `Versions - ${apiId}`,
})
</script>

