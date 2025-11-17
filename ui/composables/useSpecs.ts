/**
 * useSpecs Composable
 * 
 * @description Fetches and manages API specs list data.
 */

import type { ApiMetadata } from '~/types/api'

export function useSpecs() {
  const api = useApi()
  
  const specs = ref<ApiMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all API specs
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

  return {
    specs,
    loading,
    error,
    fetchSpecs,
    searchSpecs,
    filterByOwner,
    filterByTag,
  }
}

