/**
 * useSpecs Composable
 * 
 * @description Fetches and manages API specs list data with folder awareness.
 */

import type { ApiMetadata } from '~/types/api'

export function useSpecs(folderName?: string) {
  const api = useApi()
  
  const specs = ref<ApiMetadata[]>([])
  const currentFolder = ref<string>(folderName || 'active')
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches specs in a specific folder
   */
  async function fetchSpecsInFolder(folder?: string) {
    const targetFolder = folder || currentFolder.value
    loading.value = true
    error.value = null

    try {
      const data = await api.get<ApiMetadata[]>(`/folders/${targetFolder}/specs`)
      specs.value = data
      currentFolder.value = targetFolder
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch specs in folder:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches all API specs (deprecated - use fetchSpecsInFolder)
   * @deprecated Use fetchSpecsInFolder instead
   */
  async function fetchSpecs() {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<ApiMetadata[]>('/specs')
      specs.value = data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch specs:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Searches specs by query
   */
  const searchSpecs = (query: string) => {
    if (!query) return specs.value
    
    const q = query.toLowerCase()
    return specs.value.filter(spec =>
      spec.name.toLowerCase().includes(q) ||
      spec.api_id.toLowerCase().includes(q) ||
      spec.owner.toLowerCase().includes(q) ||
      spec.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }

  /**
   * Filters specs by owner
   */
  const filterByOwner = (owner: string) => {
    return specs.value.filter(spec => spec.owner === owner)
  }

  /**
   * Filters specs by tag
   */
  const filterByTag = (tag: string) => {
    return specs.value.filter(spec => spec.tags?.includes(tag))
  }

  /**
   * Changes the current folder and fetches its specs
   */
  async function changeFolder(folderName: string) {
    return await fetchSpecsInFolder(folderName)
  }

  return {
    specs,
    currentFolder,
    loading,
    error,
    fetchSpecs,
    fetchSpecsInFolder,
    changeFolder,
    searchSpecs,
    filterByOwner,
    filterByTag,
  }
}

