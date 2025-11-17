/**
 * useDashboardStats Composable
 * 
 * @description Fetches dashboard statistics and metrics.
 */

import type { DashboardStats } from '~/types/api'

export function useDashboardStats() {
  const api = useApi()
  
  const stats = ref<DashboardStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches dashboard statistics
   */
  async function fetchStats() {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<DashboardStats>('/stats')
      stats.value = data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch dashboard stats:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Formats stats for ECharts pie chart (specs by tag)
   */
  const specsByTagChartData = computed(() => {
    if (!stats.value?.specs_by_tag) return []
    
    return Object.entries(stats.value.specs_by_tag).map(([name, value]) => ({
      name,
      value,
    }))
  })

  /**
   * Formats recent changes for timeline chart
   */
  const recentChangesChartData = computed(() => {
    if (!stats.value?.recent_changes) return []
    
    return stats.value.recent_changes.map(change => ({
      timestamp: new Date(change.timestamp),
      event: change.event,
      api: change.api_id,
    }))
  })

  return {
    stats,
    loading,
    error,
    specsByTagChartData,
    recentChangesChartData,
    fetchStats,
  }
}

