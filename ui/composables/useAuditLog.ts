/**
 * useAuditLog Composable
 * 
 * @description Fetches and filters audit log data.
 */

import type { ApiId, AuditEvent } from '~/types/api'

export interface AuditFilters {
  apiId?: ApiId
  event?: string
  user?: string
  fromDate?: string
  toDate?: string
}

export function useAuditLog() {
  const api = useApi()
  
  const auditLog = ref<AuditEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<AuditFilters>({})

  /**
   * Fetches audit log with optional filters
   */
  async function fetchAuditLog(apiId?: ApiId) {
    loading.value = true
    error.value = null

    try {
      const endpoint = apiId ? `/audit/${apiId}` : '/audit'
      const data = await api.get<AuditEvent[]>(endpoint, filters.value as any)
      auditLog.value = data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch audit log:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Sets filters and refetches
   */
  function setFilters(newFilters: AuditFilters) {
    filters.value = { ...filters.value, ...newFilters }
    fetchAuditLog(newFilters.apiId)
  }

  /**
   * Clears all filters
   */
  function clearFilters() {
    filters.value = {}
    fetchAuditLog()
  }

  /**
   * Gets filtered audit log
   */
  const filteredAuditLog = computed(() => {
    let result = [...auditLog.value]

    if (filters.value.event) {
      result = result.filter(log => log.event === filters.value.event)
    }

    if (filters.value.user) {
      result = result.filter(log => log.user === filters.value.user)
    }

    if (filters.value.fromDate) {
      const fromDate = new Date(filters.value.fromDate)
      result = result.filter(log => new Date(log.timestamp) >= fromDate)
    }

    if (filters.value.toDate) {
      const toDate = new Date(filters.value.toDate)
      result = result.filter(log => new Date(log.timestamp) <= toDate)
    }

    return result
  })

  /**
   * Gets unique event types
   */
  const eventTypes = computed(() => {
    return [...new Set(auditLog.value.map(log => log.event))]
  })

  /**
   * Gets unique users
   */
  const users = computed(() => {
    return [...new Set(auditLog.value.map(log => log.user))]
  })

  return {
    auditLog,
    loading,
    error,
    filters,
    filteredAuditLog,
    eventTypes,
    users,
    fetchAuditLog,
    setFilters,
    clearFilters,
  }
}

