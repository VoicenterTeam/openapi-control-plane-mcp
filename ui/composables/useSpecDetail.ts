/**
 * useSpecDetail Composable
 * 
 * @description Fetches detailed spec data for a specific API.
 */

import type { ApiId, VersionTag, OpenAPISpec, ApiMetadata } from '~/types/api'

export function useSpecDetail(apiId: ApiId, version?: VersionTag) {
  const api = useApi()
  
  const spec = ref<OpenAPISpec | null>(null)
  const metadata = ref<ApiMetadata | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches spec detail
   */
  async function fetchSpec() {
    loading.value = true
    error.value = null

    try {
      // Fetch metadata first
      metadata.value = await api.get<ApiMetadata>(`/specs/${apiId}`)
      
      // Fetch spec content
      const versionToFetch = version || metadata.value.current_version
      const specData = await api.get<{ spec: OpenAPISpec }>(`/specs/${apiId}/versions/${versionToFetch}`)
      spec.value = specData.spec
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch spec detail:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Gets all endpoints from spec
   */
  const endpoints = computed(() => {
    if (!spec.value?.paths) return []
    
    const result: Array<{
      path: string
      method: string
      operation: any
      tags: string[]
    }> = []

    Object.entries(spec.value.paths).forEach(([path, pathItem]) => {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
      methods.forEach(method => {
        if (pathItem[method]) {
          result.push({
            path,
            method: method.toUpperCase(),
            operation: pathItem[method],
            tags: pathItem[method].tags || [],
          })
        }
      })
    })

    return result
  })

  /**
   * Gets endpoints grouped by tag
   */
  const endpointsByTag = computed(() => {
    const grouped: Record<string, typeof endpoints.value> = {}
    
    endpoints.value.forEach(endpoint => {
      const tags = endpoint.tags.length > 0 ? endpoint.tags : ['Untagged']
      tags.forEach(tag => {
        if (!grouped[tag]) grouped[tag] = []
        grouped[tag].push(endpoint)
      })
    })

    return grouped
  })

  /**
   * Gets all schemas from spec
   */
  const schemas = computed(() => {
    return spec.value?.components?.schemas || {}
  })

  return {
    spec,
    metadata,
    loading,
    error,
    endpoints,
    endpointsByTag,
    schemas,
    fetchSpec,
  }
}

