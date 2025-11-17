<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Track all changes to OpenAPI specifications
      </p>
    </div>

        <!-- Filters -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Type</label>
            <select 
              v-model="selectedEvent"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Events</option>
              <option v-for="event in eventTypes" :key="event" :value="event">
                {{ event }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
            <select 
              v-model="selectedUser"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Users</option>
              <option v-for="user in users" :key="user" :value="user">
                {{ user }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input 
              v-model="fromDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex items-end space-x-2">
            <button
              @click="applyFilters"
              class="flex-1 px-4 py-2 bg-voicenter-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
            <button
              @click="clearAllFilters"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-voicenter-primary"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Audit Log Table -->
        <div v-else-if="filteredAuditLog.length > 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="(log, index) in filteredAuditLog" 
                  :key="index"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ formatTimestamp(log.timestamp) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getEventClass(log.event)"
                    >
                      {{ log.event }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <NuxtLink :to="`/specs/${log.api_id}`" class="hover:text-voicenter-primary">
                      {{ log.api_id }}
                    </NuxtLink>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <VersionBadge v-if="log.version" :version="log.version" />
                    <span v-else>-</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ log.user }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <div v-if="log.llm_reason" class="max-w-md">
                      <p class="text-xs italic">{{ log.llm_reason }}</p>
                    </div>
                    <div v-else-if="log.details" class="text-xs font-mono">
                      {{ JSON.stringify(log.details).substring(0, 50) }}...
                    </div>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No audit logs found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No activity has been recorded yet
          </p>
        </div>
  </div>
</template>

<script setup lang="ts">
const { auditLog, loading, error, filteredAuditLog, eventTypes, users, fetchAuditLog, setFilters, clearFilters } = useAuditLog()

const selectedEvent = ref('')
const selectedUser = ref('')
const fromDate = ref('')

onMounted(() => {
  fetchAuditLog()
})

function applyFilters() {
  setFilters({
    event: selectedEvent.value || undefined,
    user: selectedUser.value || undefined,
    fromDate: fromDate.value || undefined,
  })
}

function clearAllFilters() {
  selectedEvent.value = ''
  selectedUser.value = ''
  fromDate.value = ''
  clearFilters()
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function getEventClass(event: string): string {
  const destructiveEvents = ['endpoint_deleted', 'schema_deleted', 'version_deleted', 'spec_deleted']
  const modifyEvents = ['endpoint_modified', 'schema_modified', 'metadata_updated']
  const createEvents = ['version_created', 'endpoint_added', 'schema_added']

  if (destructiveEvents.some(e => event.includes(e))) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  if (modifyEvents.some(e => event.includes(e))) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  }
  if (createEvents.some(e => event.includes(e))) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

useHead({
  title: 'Audit Log',
})
</script>

