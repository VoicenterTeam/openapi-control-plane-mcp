<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ spec.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ spec.api_id }}
        </p>
      </div>
      <VersionBadge :version="spec.current_version" current />
    </div>

    <p v-if="spec.description" class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
      {{ spec.description }}
    </p>

    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-4">
        <span class="text-gray-600 dark:text-gray-400">
          <span class="font-medium text-gray-900 dark:text-white">{{ stats?.endpoint_count || 0 }}</span> endpoints
        </span>
        <span class="text-gray-600 dark:text-gray-400">
          <span class="font-medium text-gray-900 dark:text-white">{{ spec.versions.length }}</span> versions
        </span>
      </div>
    </div>

    <div v-if="spec.tags && spec.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
      <span 
        v-for="tag in spec.tags" 
        :key="tag"
        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
      >
        {{ tag }}
      </span>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>Owner: {{ spec.owner }}</span>
      <span>{{ formatDate(spec.created_at) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiMetadata, VersionStats } from '~/types/api'

interface Props {
  spec: ApiMetadata
  stats?: VersionStats
}

const props = defineProps<Props>()
defineEmits(['click'])

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}
</script>

