<template>
  <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="max-w-full px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-4">
          <NuxtLink to="/" class="flex items-center space-x-3">
            <img src="/voicenter-logo.svg" alt="Voicenter" class="h-8" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">OpenAPI Control Panel</span>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <NuxtLink 
            to="/" 
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
            :class="$route.path === '/' ? '' : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink 
            to="/specs" 
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
            :class="$route.path.startsWith('/specs') ? '' : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'"
          >
            Specs
          </NuxtLink>
          <NuxtLink 
            to="/audit" 
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
            :class="$route.path === '/audit' ? '' : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'"
          >
            Audit Log
          </NuxtLink>
        </nav>

        <!-- Dark Mode Toggle -->
        <div class="flex items-center space-x-4">
          <button
            @click="toggleDark"
            class="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Toggle dark mode"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

