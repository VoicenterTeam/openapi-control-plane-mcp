/**
 * useFolders Composable
 * 
 * @description Manages folder operations for workspace organization.
 * Your folder management Swiss Army knife. 📁
 */

import type { FolderMetadata } from '~/types/api'

const STORAGE_KEY = 'openapi-control-panel:last-folder'

export function useFolders() {
  const api = useApi()
  
  const folders = ref<FolderMetadata[]>([])
  // Load last folder from localStorage, default to 'active'
  const currentFolder = ref<string>(
    typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEY) || 'active'
      : 'active'
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all folders with metadata
   */
  async function fetchFolders() {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<FolderMetadata[]>('/folders')
      folders.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch folders:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new folder
   */
  async function createFolder(metadata: {
    name: string
    title: string
    description?: string
    color?: string
    icon?: string
  }) {
    loading.value = true
    error.value = null

    try {
      const data = await api.post<FolderMetadata>('/folders', metadata)
      
      // Add to local list
      folders.value.push(data)
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to create folder:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Gets a specific folder by name
   */
  async function getFolder(folderName: string) {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<FolderMetadata>(`/folders/${folderName}`)
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to get folder:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates folder metadata
   */
  async function updateFolder(
    folderName: string,
    updates: {
      title?: string
      description?: string
      color?: string
      icon?: string
    }
  ) {
    loading.value = true
    error.value = null

    try {
      const data = await api.put<FolderMetadata>(`/folders/${folderName}`, updates)
      
      // Update in local list
      const index = folders.value.findIndex(f => f.name === folderName)
      if (index !== -1) {
        folders.value[index] = data
      }
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to update folder:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Deletes a folder (must be empty)
   */
  async function deleteFolder(folderName: string) {
    loading.value = true
    error.value = null

    try {
      await api.delete(`/folders/${folderName}`)
      
      // Remove from local list
      folders.value = folders.value.filter(f => f.name !== folderName)
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to delete folder:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Moves a spec to a different folder
   */
  async function moveSpec(apiId: string, targetFolder: string) {
    loading.value = true
    error.value = null

    try {
      const data = await api.post(`/specs/${apiId}/move`, { targetFolder })
      
      // Refresh folder spec counts
      await fetchFolders()
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to move spec:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sets the current active folder and persists to localStorage
   */
  function setCurrentFolder(folderName: string) {
    currentFolder.value = folderName
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, folderName)
    }
  }

  /**
   * Watch currentFolder changes and persist to localStorage
   * Ensures persistence even when folder is set directly
   */
  watch(currentFolder, (newFolder) => {
    if (typeof window !== 'undefined' && newFolder) {
      localStorage.setItem(STORAGE_KEY, newFolder)
    }
  })

  /**
   * Gets folder by name from local cache
   */
  function getFolderByName(folderName: string) {
    return folders.value.find(f => f.name === folderName)
  }

  /**
   * Sorts folders by name
   */
  const sortedFolders = computed(() => {
    return [...folders.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  /**
   * Gets active folder metadata
   */
  const activeFolderMetadata = computed(() => {
    return folders.value.find(f => f.name === currentFolder.value)
  })

  return {
    folders,
    currentFolder,
    loading,
    error,
    fetchFolders,
    createFolder,
    getFolder,
    updateFolder,
    deleteFolder,
    moveSpec,
    setCurrentFolder,
    getFolderByName,
    sortedFolders,
    activeFolderMetadata,
  }
}

