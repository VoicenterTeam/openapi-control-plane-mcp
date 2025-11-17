/**
 * useVersions Composable
 * 
 * @description Fetches version history for an API.
 */

import type { ApiId, VersionTag, VersionMetadata } from '~/types/api'

export function useVersions(apiId: ApiId) {
  const api = useApi()
  
  const versions = ref<VersionMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all versions for an API
   */
  async function fetchVersions() {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<VersionMetadata[]>(`/specs/${apiId}/versions`)
      versions.value = data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch versions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches a specific version
   */
  async function fetchVersion(version: VersionTag) {
    try {
      const data = await api.get<VersionMetadata>(`/specs/${apiId}/versions/${version}`)
      return data
    } catch (err: any) {
      console.error(`Failed to fetch version ${version}:`, err)
      throw err
    }
  }

  /**
   * Gets versions sorted by date (newest first)
   */
  const sortedVersions = computed(() => {
    return [...versions.value].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  })

  /**
   * Gets versions with breaking changes
   */
  const versionsWithBreakingChanges = computed(() => {
    return versions.value.filter(v => v.changes.breaking_changes.length > 0)
  })

  return {
    versions,
    loading,
    error,
    sortedVersions,
    versionsWithBreakingChanges,
    fetchVersions,
    fetchVersion,
  }
}

