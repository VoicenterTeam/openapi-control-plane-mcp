/**
 * Folder Manager Service
 *
 * @description Manages workspace folders for organizing API specs by team, project, or any
 * classification that brings joy to your organizational soul. Like a filing system but digital.
 * And without the paper cuts. 📁
 *
 * @module services/folder-manager
 */

import type { ApiId } from '../types/openapi.js'
import type { FolderMetadata } from '../types/metadata.js'
import type { BaseStorageProvider } from '../storage/base-storage-provider.js'
import { logger } from '../utils/logger.js'
import { createStorageError, createValidationError } from '../utils/errors.js'
import { type CacheService } from './cache-service.js'

/**
 * Folder Manager Service
 * @description Manages organizational folders for API specs. The Marie Kondo of API management.
 */
export class FolderManager {
  private storage: BaseStorageProvider
  private folderCache: Map<string, FolderMetadata> = new Map()
  private cache?: CacheService

  /**
   * Creates a new folder manager
   * @param storage - Storage provider for folder metadata
   * @param cache - Cache service
   * @description Initializes the folder management system
   */
  constructor(storage: BaseStorageProvider, cache?: CacheService) {
    this.storage = storage
    this.cache = cache
  }

  /**
   * Lists all folders with their metadata
   * @param includeSpecCount - Whether to compute spec counts for each folder
   * @returns Promise resolving to array of folder metadata
   * @description Gets all the filing cabinets. Every single drawer label.
   */
  async listFolders(includeSpecCount = true): Promise<FolderMetadata[]> {
    const cacheKey = 'folders:list'
    
    if (this.cache) {
      return this.cache.get(cacheKey, () => this.doListFolders(includeSpecCount))
    }
    
    return this.doListFolders(includeSpecCount)
  }

  /**
   * Internal folder listing logic (without cache)
   */
  private async doListFolders(includeSpecCount = true): Promise<FolderMetadata[]> {
    try {
      // List all top-level directories
      const allItems = await this.storage.list('/')
      
      // Extract unique folder names (top-level dirs)
      const folderNames = [...new Set(
        allItems
          .filter((item) => {
            // Exclude hidden files/dirs and non-folder items
            const parts = item.split(/[/\\]/)
            return !parts[0].startsWith('.') && !parts[0].startsWith('_')
          })
          .map((item) => item.split(/[/\\]/)[0])
      )]

      const folders: FolderMetadata[] = []

      for (const folderName of folderNames) {
        try {
          const metadata = await this.getFolderMetadata(folderName)
          
          // Compute spec count if requested
          if (includeSpecCount) {
            metadata.spec_count = await this.getSpecCount(folderName)
          }
          
          folders.push(metadata)
        } catch (error) {
          // If no _folder.json exists, skip this directory
          logger.debug({ folderName, error }, 'Skipping directory without folder metadata')
        }
      }

      return folders.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      logger.error({ error }, 'Failed to list folders')
      throw createStorageError(
        'Failed to list folders',
        '/',
        'read',
        error as Error
      )
    }
  }

  /**
   * Creates a new folder with metadata
   * @param name - Folder name (kebab-case, filesystem-safe)
   * @param metadata - Folder metadata (title, description, color, etc.)
   * @returns Promise resolving to created folder metadata
   * @description Adds a new filing cabinet drawer. With a fancy label. ✨
   */
  async createFolder(
    name: string,
    metadata: Omit<FolderMetadata, 'name' | 'created_at' | 'spec_count'>
  ): Promise<FolderMetadata> {
    try {
      // Validate folder name
      this.validateFolderName(name)

      const metadataPath = this.getFolderMetadataPath(name)

      // Check if folder already exists
      if (await this.storage.exists(metadataPath)) {
        throw createValidationError(
          `Folder '${name}' already exists`,
          'name'
        )
      }

      const folderMetadata: FolderMetadata = {
        name,
        ...metadata,
        created_at: new Date().toISOString(),
        spec_count: 0,
      }

      // Create folder metadata file
      await this.storage.write(metadataPath, JSON.stringify(folderMetadata, null, 2))

      // Update cache
      this.folderCache.set(name, folderMetadata)
      
      // Invalidate cache
      if (this.cache) {
        this.cache.invalidate('folders:list')
        this.cache.invalidate(`folders:${name}:*`)
        this.cache.invalidate('stats:global')
      }

      logger.info({ name, metadata }, 'Folder created')

      return folderMetadata
    } catch (error) {
      logger.error({ error, name }, 'Failed to create folder')
      throw error
    }
  }

  /**
   * Retrieves folder metadata
   * @param folderName - Name of the folder
   * @returns Promise resolving to folder metadata
   * @description Gets the details on a specific filing cabinet drawer
   */
  async getFolderMetadata(folderName: string): Promise<FolderMetadata> {
    try {
      // Check cache first
      if (this.folderCache.has(folderName)) {
        return this.folderCache.get(folderName)!
      }

      const metadataPath = this.getFolderMetadataPath(folderName)
      const data = await this.storage.read(metadataPath)
      const metadata = JSON.parse(data) as FolderMetadata

      // Cache it
      this.folderCache.set(folderName, metadata)

      return metadata
    } catch (error) {
      logger.error({ error, folderName }, 'Failed to retrieve folder metadata')
      throw createStorageError(
        `Failed to retrieve folder metadata for '${folderName}'`,
        this.getFolderMetadataPath(folderName),
        'read',
        error as Error
      )
    }
  }

  /**
   * Updates folder metadata
   * @param folderName - Name of the folder
   * @param updates - Partial metadata updates
   * @returns Promise resolving to updated metadata
   * @description Changes the label on the filing cabinet drawer
   */
  async updateFolderMetadata(
    folderName: string,
    updates: Partial<Omit<FolderMetadata, 'name' | 'created_at' | 'spec_count'>>
  ): Promise<FolderMetadata> {
    try {
      const metadata = await this.getFolderMetadata(folderName)
      const updated = { ...metadata, ...updates }

      const metadataPath = this.getFolderMetadataPath(folderName)
      await this.storage.write(metadataPath, JSON.stringify(updated, null, 2))

      // Update cache
      this.folderCache.set(folderName, updated)
      
      // Invalidate cache
      if (this.cache) {
        this.cache.invalidate('folders:list')
        this.cache.invalidate(`folders:${folderName}:*`)
      }

      logger.info({ folderName, updates }, 'Folder metadata updated')

      return updated
    } catch (error) {
      logger.error({ error, folderName, updates }, 'Failed to update folder metadata')
      throw error
    }
  }

  /**
   * Deletes a folder (only if empty)
   * @param folderName - Name of the folder to delete
   * @returns Promise resolving when folder is deleted
   * @description Removes a filing cabinet drawer. But only if it's empty. Safety first! 🔒
   */
  async deleteFolder(folderName: string): Promise<void> {
    try {
      // Validate folder exists
      await this.getFolderMetadata(folderName)

      // Check if folder is empty
      const specCount = await this.getSpecCount(folderName)
      if (specCount > 0) {
        throw createValidationError(
          `Cannot delete folder '${folderName}' - it contains ${specCount} spec(s)`,
          'folderName'
        )
      }

      // Delete folder metadata
      const metadataPath = this.getFolderMetadataPath(folderName)
      await this.storage.delete(metadataPath)

      // Remove from cache
      this.folderCache.delete(folderName)
      
      // Invalidate cache
      if (this.cache) {
        this.cache.invalidate('folders:list')
        this.cache.invalidate(`folders:${folderName}:*`)
        this.cache.invalidate('stats:global')
      }

      logger.warn({ folderName }, 'Folder deleted')
    } catch (error) {
      logger.error({ error, folderName }, 'Failed to delete folder')
      throw error
    }
  }

  /**
   * Lists all API specs in a folder
   * @param folderName - Name of the folder
   * @returns Promise resolving to array of API IDs in the folder
   * @description Lists all the files in a specific filing cabinet drawer
   */
  async listSpecsInFolder(folderName: string): Promise<ApiId[]> {
    try {
      // Validate folder exists
      await this.getFolderMetadata(folderName)

      const allItems = await this.storage.list(folderName)
      
      // Extract API IDs (directories within folder, excluding metadata file)
      const apiIds = [...new Set(
        allItems
          .filter((item) => {
            const parts = item.split(/[/\\]/)
            // Exclude the folder metadata file and hidden dirs
            return parts[0] === folderName && 
                   parts[1] && 
                   !parts[1].startsWith('_') && 
                   !parts[1].startsWith('.')
          })
          .map((item) => {
            const parts = item.split(/[/\\]/)
            return parts[1] as ApiId
          })
      )]

      return apiIds
    } catch (error) {
      logger.error({ error, folderName }, 'Failed to list specs in folder')
      throw error
    }
  }

  /**
   * Moves an API spec from one folder to another
   * @param apiId - API identifier to move
   * @param fromFolder - Source folder name
   * @param toFolder - Target folder name
   * @returns Promise resolving when move is complete
   * @description Moves a file from one drawer to another. All versions come along for the ride. 🚚
   */
  async moveSpec(
    apiId: ApiId,
    fromFolder: string,
    toFolder: string
  ): Promise<void> {
    try {
      // Validate both folders exist
      await this.getFolderMetadata(fromFolder)
      await this.getFolderMetadata(toFolder)

      const sourcePath = `${fromFolder}/${apiId}`
      const targetPath = `${toFolder}/${apiId}`

      // Check if source exists
      const sourceExists = await this.storage.exists(`${sourcePath}/metadata.json`)
      if (!sourceExists) {
        throw createValidationError(
          `API '${apiId}' not found in folder '${fromFolder}'`,
          'apiId'
        )
      }

      // Check if target already exists
      const targetExists = await this.storage.exists(`${targetPath}/metadata.json`)
      if (targetExists) {
        throw createValidationError(
          `API '${apiId}' already exists in folder '${toFolder}'`,
          'apiId'
        )
      }

      // Move the entire API directory (all versions)
      await this.moveDirectory(sourcePath, targetPath)
      
      // Invalidate cache
      if (this.cache) {
        this.cache.invalidate('folders:list')
        this.cache.invalidate(`folders:${fromFolder}:*`)
        this.cache.invalidate(`folders:${toFolder}:*`)
        this.cache.invalidate(`specs:${apiId}:*`)
        this.cache.invalidate('stats:global')
      }

      logger.info({ apiId, fromFolder, toFolder }, 'Spec moved between folders')
    } catch (error) {
      logger.error({ error, apiId, fromFolder, toFolder }, 'Failed to move spec')
      throw error
    }
  }

  /**
   * Finds which folder contains a specific API
   * @param apiId - API identifier to search for
   * @returns Promise resolving to folder name or null if not found
   * @description Searches all filing cabinets to find where a specific file is hiding
   */
  async findSpecFolder(apiId: ApiId): Promise<string | null> {
    try {
      const folders = await this.listFolders(false)
      
      for (const folder of folders) {
        const metadataPath = `${folder.name}/${apiId}/metadata.json`
        if (await this.storage.exists(metadataPath)) {
          return folder.name
        }
      }
      
      return null
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to find spec folder')
      return null
    }
  }

  /**
   * Counts the number of specs in a folder
   * @param folderName - Name of the folder
   * @returns Promise resolving to spec count
   * @description Counts the files in a drawer. Math time! 🔢
   */
  private async getSpecCount(folderName: string): Promise<number> {
    const cacheKey = `folders:${folderName}:count`
    
    if (this.cache) {
      return this.cache.get(cacheKey, () => this.doGetSpecCount(folderName))
    }
    
    return this.doGetSpecCount(folderName)
  }

  /**
   * Internal spec count logic (without cache)
   */
  private async doGetSpecCount(folderName: string): Promise<number> {
    try {
      const apiIds = await this.listSpecsInFolder(folderName)
      return apiIds.length
    } catch (error) {
      logger.error({ error, folderName }, 'Failed to get spec count')
      return 0
    }
  }

  /**
   * Moves a directory and all its contents
   * @param sourcePath - Source directory path
   * @param targetPath - Target directory path
   * @description Recursively moves directories. Like playing Tetris with files. 🎮
   */
  private async moveDirectory(sourcePath: string, targetPath: string): Promise<void> {
    try {
      // Get all files in source directory
      const allItems = await this.storage.list(sourcePath)
      
      // Filter items that belong to this directory
      const itemsToMove = allItems.filter(item => item.startsWith(sourcePath))
      
      // Move each file
      for (const item of itemsToMove) {
        const relativePath = item.slice(sourcePath.length)
        const newPath = targetPath + relativePath
        
        // Read source file
        const content = await this.storage.read(item)
        
        // Write to target
        await this.storage.write(newPath, content)
        
        // Delete source
        await this.storage.delete(item)
      }

      logger.debug({ sourcePath, targetPath, fileCount: itemsToMove.length }, 'Directory moved')
    } catch (error) {
      logger.error({ error, sourcePath, targetPath }, 'Failed to move directory')
      throw createStorageError(
        'Failed to move directory',
        sourcePath,
        'write',
        error as Error
      )
    }
  }

  /**
   * Validates folder name format
   * @param name - Folder name to validate
   * @description Ensures folder names are filesystem-friendly. No shenanigans allowed.
   */
  private validateFolderName(name: string): void {
    // Must be kebab-case: lowercase, alphanumeric, hyphens only
    const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!validPattern.test(name)) {
      throw createValidationError(
        'Folder name must be kebab-case (lowercase, alphanumeric, hyphens only)',
        'name'
      )
    }

    // Prevent reserved names
    const reserved = ['..', '.', 'con', 'prn', 'aux', 'nul', 'com1', 'lpt1']
    if (reserved.includes(name.toLowerCase())) {
      throw createValidationError(
        `Folder name '${name}' is reserved`,
        'name'
      )
    }

    // Reasonable length
    if (name.length < 2 || name.length > 64) {
      throw createValidationError(
        'Folder name must be between 2 and 64 characters',
        'name'
      )
    }
  }

  /**
   * Gets the path to a folder's metadata file
   * @param folderName - Name of the folder
   * @returns Path to _folder.json
   */
  private getFolderMetadataPath(folderName: string): string {
    return `${folderName}/_folder.json`
  }

  /**
   * Clears the folder metadata cache
   * @description Nuclear option for cache invalidation. Use sparingly.
   */
  clearCache(): void {
    this.folderCache.clear()
    logger.debug('Folder cache cleared')
  }
}

