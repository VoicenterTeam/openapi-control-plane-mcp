<template>
  <aside class="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
    <nav class="p-6 space-y-2">
      <!-- Dashboard -->
      <NuxtLink 
        to="/" 
        class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
        :class="isActive('/') 
          ? 'bg-voicenter-primary text-white' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="font-medium">Dashboard</span>
      </NuxtLink>

      <!-- Specs -->
      <NuxtLink 
        to="/specs" 
        class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
        :class="isActive('/specs') 
          ? 'bg-voicenter-primary text-white' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="font-medium">API Specs</span>
      </NuxtLink>

      <!-- Audit Log -->
      <NuxtLink 
        to="/audit" 
        class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
        :class="isActive('/audit') 
          ? 'bg-voicenter-primary text-white' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span class="font-medium">Audit Log</span>
      </NuxtLink>

      <!-- Divider -->
      <div class="pt-6 pb-2">
        <div class="h-px bg-gray-200 dark:bg-gray-700"></div>
      </div>

      <!-- Quick Stats -->
      <div class="pt-2 space-y-3">
        <div class="px-4 py-2">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Quick Stats
          </p>
        </div>
        <div v-if="stats" class="space-y-2 px-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Total Specs</span>
            <span class="font-semibold text-voicenter-primary">{{ stats.total_specs }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Versions</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ stats.total_versions }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Endpoints</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ stats.total_endpoints }}</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { stats, fetchStats } = useDashboardStats()

// Fetch stats on mount
onMounted(() => {
  fetchStats()
})

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

