<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-voicenter-primary"></div>
    </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Spec Content -->
        <div v-else-if="spec && metadata">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ spec.info.title }}
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  {{ spec.info.description }}
                </p>
                <div class="mt-4 flex items-center space-x-4">
                  <VersionBadge :version="metadata.current_version" current />
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    Owner: {{ metadata.owner }}
                  </span>
                  <NuxtLink 
                    :to="`/specs/${apiId}/versions`"
                    class="text-sm text-voicenter-primary hover:underline"
                  >
                    View All Versions
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- API Info -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">Endpoints</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ endpoints.length }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">Schemas</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ Object.keys(schemas).length }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">Version</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ spec.info.version }}</p>
            </div>
          </div>

          <!-- Endpoints by Tag -->
          <div class="space-y-6">
            <div v-for="(tagEndpoints, tag) in endpointsByTag" :key="tag" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ tag }}</h2>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <div 
                  v-for="(endpoint, idx) in tagEndpoints" 
                  :key="`${endpoint.path}-${endpoint.method}-${idx}`"
                  class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div class="flex items-start space-x-4">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold"
                      :class="getMethodClass(endpoint.method)"
                    >
                      {{ endpoint.method }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <code class="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {{ endpoint.path }}
                      </code>
                      <p v-if="endpoint.operation.summary" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {{ endpoint.operation.summary }}
                      </p>
                      <p v-if="endpoint.operation.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {{ endpoint.operation.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Schemas Section -->
          <div v-if="Object.keys(schemas).length > 0" class="mt-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Schemas</h2>
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <details 
                v-for="(schema, name) in schemas" 
                :key="name"
                class="group"
              >
                <summary class="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-between">
                  <span class="font-mono text-sm font-medium text-gray-900 dark:text-white">{{ name }}</span>
                  <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                  <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{{ JSON.stringify(schema, null, 2) }}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const apiId = route.params.apiId as string

const { spec, metadata, loading, error, endpoints, endpointsByTag, schemas, fetchSpec } = useSpecDetail(apiId)

onMounted(() => {
  fetchSpec()
})

function getMethodClass(method: string): string {
  const classes: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

useHead({
  title: () => spec.value ? `${spec.value.info.title} - API Viewer` : 'API Viewer',
})
</script>

