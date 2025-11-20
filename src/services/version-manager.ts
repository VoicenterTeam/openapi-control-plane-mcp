/**
 * Version Manager Service
 *
 * @description Manages OpenAPI specification versions with style and grace.
 * Like a librarian but for API versions. Organized chaos at its finest. 📚🔖
 * Now with folder awareness for multi-workspace organization!
 *
 * @module services/version-manager
 */

import type { ApiId, VersionTag } from '../types/openapi.js'
import type { ApiMetadata, VersionMetadata } from '../types/metadata.js'
import type { BaseStorageProvider } from '../storage/base-storage-provider.js'
import { logger } from '../utils/logger.js'
import { createStorageError, createValidationError } from '../utils/errors.js'

/**
 * Version Manager Service
 * @description Manages versions of OpenAPI specifications. The version control system.
 * Keeps track of what came before, what is now, and what's coming next. 🕰️
 * Now supports folder-based organization for those who love order.
 */
export class VersionManager {
  private storage: BaseStorageProvider
  private defaultFolder: string = 'active'

  /**
   * Creates a new version manager
   * @param storage - Storage provider for metadata
   * @param defaultFolder - Default folder for new specs (defaults to 'active')
   * @description Sets up the version management system
   */
  constructor(storage: BaseStorageProvider, defaultFolder: string = 'active') {
    this.storage = storage
    this.defaultFolder = defaultFolder
  }

  /**
   * Creates API metadata entry for a new API
   * @param apiId - API identifier
   * @param name - Human-readable API name
   * @param owner - Owner/team responsible
   * @param initialVersion - First version tag
   * @param folder - Folder to place the API in (defaults to 'active')
   * @returns Promise resolving to created metadata
   * @description Initializes a new API in the system. Birth certificate for APIs.
   */
  async createApiMetadata(
    apiId: ApiId,
    name: string,
    owner: string,
    initialVersion: VersionTag,
    folder?: string
  ): Promise<ApiMetadata> {
    try {
      const targetFolder = folder || this.defaultFolder
      const metadataPath = this.getMetadataPath(apiId, targetFolder)

      // Check if metadata already exists
      if (await this.storage.exists(metadataPath)) {
        throw createValidationError('API metadata already exists', 'api_id')
      }

      const metadata: ApiMetadata = {
        api_id: apiId,
        name,
        created_at: new Date().toISOString(),
        current_version: initialVersion,
        versions: [initialVersion],
        latest_stable: initialVersion,
        owner,
        folder: targetFolder,
      }

      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, name, owner, initialVersion, folder: targetFolder }, 'API metadata created')

      return metadata
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to create API metadata')
      throw error
    }
  }

  /**
   * Retrieves API metadata
   * @param apiId - API identifier
   * @param folder - Specific folder to search in (optional, searches all folders if not provided)
   * @returns Promise resolving to API metadata
   * @description Gets the API's vital statistics. Can search specific folder or all folders.
   */
  async getApiMetadata(apiId: ApiId, folder?: string): Promise<ApiMetadata> {
    try {
      let metadataPath: string
      
      if (folder) {
        // Search in specific folder
        metadataPath = this.getMetadataPath(apiId, folder)
      } else {
        // Search all folders to find the API
        const foundFolder = await this.findApiFolder(apiId)
        if (!foundFolder) {
          throw createStorageError(
            `API '${apiId}' not found in any folder`,
            `*/${apiId}/metadata.json`,
            'read'
          )
        }
        metadataPath = this.getMetadataPath(apiId, foundFolder)
      }
      
      const data = await this.storage.read(metadataPath)
      return JSON.parse(data) as ApiMetadata
    } catch (error) {
      logger.error({ error, apiId, folder }, 'Failed to retrieve API metadata')
      throw createStorageError(
        `Failed to retrieve API metadata: ${(error as Error).message}`,
        folder ? this.getMetadataPath(apiId, folder) : `*/${apiId}/metadata.json`,
        'read'
      )
    }
  }

  /**
   * Updates API metadata
   * @param apiId - API identifier
   * @param updates - Partial metadata updates
   * @param folder - Specific folder (optional, will search all if not provided)
   * @returns Promise resolving to updated metadata
   * @description Updates API information. For when things change.
   */
  async updateApiMetadata(
    apiId: ApiId,
    updates: Partial<Omit<ApiMetadata, 'api_id' | 'created_at'>>,
    folder?: string
  ): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId, folder)
      const updated = { ...metadata, ...updates }

      const actualFolder = metadata.folder || this.defaultFolder
      const metadataPath = this.getMetadataPath(apiId, actualFolder)
      await this.storage.write(metadataPath, JSON.stringify(updated, null, 2))

      logger.info({ apiId, updates, folder: actualFolder }, 'API metadata updated')

      return updated
    } catch (error) {
      logger.error({ error, apiId, updates }, 'Failed to update API metadata')
      throw error
    }
  }

  /**
   * Adds a new version to an API
   * @param apiId - API identifier
   * @param version - New version tag
   * @param setCurrent - Whether to make this the current version
   * @returns Promise resolving to updated metadata
   * @description Registers a new version. Another chapter in the API's story.
   */
  async addVersion(
    apiId: ApiId,
    version: VersionTag,
    setCurrent = true
  ): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId)

      // Check if version already exists
      if (metadata.versions.includes(version)) {
        throw createValidationError('Version already exists', 'version')
      }

      // Add version to list (newest first)
      metadata.versions = [version, ...metadata.versions]

      // Update current version if requested
      if (setCurrent) {
        metadata.current_version = version
      }

      const metadataPath = this.getMetadataPath(apiId)
      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, version, setCurrent }, 'Version added to API')

      return metadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to add version')
      throw error
    }
  }

  /**
   * Lists all versions for an API
   * @param apiId - API identifier
   * @returns Promise resolving to array of version tags
   * @description Gets all the versions. The full timeline.
   */
  async listVersions(apiId: ApiId): Promise<VersionTag[]> {
    try {
      const metadata = await this.getApiMetadata(apiId)
      return metadata.versions
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to list versions')
      throw error
    }
  }

  /**
   * Sets the current version
   * @param apiId - API identifier
   * @param version - Version to set as current
   * @returns Promise resolving to updated metadata
   * @description Points the "current" pointer to a different version. Time travel.
   */
  async setCurrentVersion(apiId: ApiId, version: VersionTag): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId)

      // Validate version exists
      if (!metadata.versions.includes(version)) {
        throw createValidationError('Version does not exist', 'version')
      }

      metadata.current_version = version

      const metadataPath = this.getMetadataPath(apiId)
      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, version }, 'Current version updated')

      return metadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to set current version')
      throw error
    }
  }

  /**
   * Sets the latest stable version
   * @param apiId - API identifier
   * @param version - Version to mark as stable
   * @returns Promise resolving to updated metadata
   * @description Stamps a version as "production ready". The seal of approval.
   */
  async setLatestStable(apiId: ApiId, version: VersionTag): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId)

      // Validate version exists
      if (!metadata.versions.includes(version)) {
        throw createValidationError('Version does not exist', 'version')
      }

      metadata.latest_stable = version

      const metadataPath = this.getMetadataPath(apiId)
      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, version }, 'Latest stable version updated')

      return metadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to set latest stable')
      throw error
    }
  }

  /**
   * Creates version-specific metadata
   * @param apiId - API identifier
   * @param version - Version tag
   * @param metadata - Version metadata
   * @param folder - Specific folder (optional, will search all if not provided)
   * @returns Promise resolving when metadata is saved
   * @description Records detailed info about a specific version. The version's dossier.
   */
  async createVersionMetadata(
    apiId: ApiId,
    version: VersionTag,
    metadata: VersionMetadata,
    folder?: string
  ): Promise<void> {
    try {
      // If folder not specified, find where the API lives
      const targetFolder = folder || await this.findApiFolder(apiId) || this.defaultFolder
      const versionPath = this.getVersionMetadataPath(apiId, version, targetFolder)
      await this.storage.write(versionPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, version, folder: targetFolder }, 'Version metadata created')
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to create version metadata')
      throw createStorageError(
        `Failed to create version metadata: ${(error as Error).message}`,
        this.getVersionMetadataPath(apiId, version, folder),
        'write'
      )
    }
  }

  /**
   * Retrieves version-specific metadata
   * @param apiId - API identifier
   * @param version - Version tag
   * @param folder - Specific folder (optional, will search all if not provided)
   * @returns Promise resolving to version metadata
   * @description Gets the details about a specific version
   */
  async getVersionMetadata(apiId: ApiId, version: VersionTag, folder?: string): Promise<VersionMetadata> {
    try {
      // If folder not specified, find where the API lives
      const targetFolder = folder || await this.findApiFolder(apiId) || this.defaultFolder
      const versionPath = this.getVersionMetadataPath(apiId, version, targetFolder)
      const data = await this.storage.read(versionPath)
      return JSON.parse(data) as VersionMetadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to retrieve version metadata')
      throw createStorageError(
        `Failed to retrieve version metadata: ${(error as Error).message}`,
        this.getVersionMetadataPath(apiId, version, folder),
        'read'
      )
    }
  }

  /**
   * Moves an API to a different folder
   * @param apiId - API identifier
   * @param targetFolder - Destination folder
   * @returns Promise resolving to updated metadata
   * @description Relocates an API to a new workspace. Like moving offices but less exhausting.
   */
  async moveApiToFolder(apiId: ApiId, targetFolder: string): Promise<ApiMetadata> {
    try {
      // Get current metadata
      const metadata = await this.getApiMetadata(apiId)
      const currentFolder = metadata.folder || this.defaultFolder

      if (currentFolder === targetFolder) {
        logger.info({ apiId, folder: targetFolder }, 'API already in target folder')
        return metadata
      }

      // Update metadata with new folder
      metadata.folder = targetFolder

      // Write to new location
      const newMetadataPath = this.getMetadataPath(apiId, targetFolder)
      await this.storage.write(newMetadataPath, JSON.stringify(metadata, null, 2))

      // Note: The actual file moving is handled by FolderManager.moveSpec()
      // This method just updates the metadata reference

      logger.info({ apiId, from: currentFolder, to: targetFolder }, 'API folder reference updated')

      return metadata
    } catch (error) {
      logger.error({ error, apiId, targetFolder }, 'Failed to move API to folder')
      throw error
    }
  }

  /**
   * Finds which folder contains a specific API
   * @param apiId - API identifier
   * @returns Promise resolving to folder name or null if not found
   * @description Searches all folders to locate an API. The "where did I put that?" function.
   */
  async findApiFolder(apiId: ApiId): Promise<string | null> {
    try {
      // List all top-level directories (potential folders)
      const allItems = await this.storage.list('/')
      const folderNames = [...new Set(
        allItems
          .filter((item) => !item.startsWith('.') && !item.startsWith('_'))
          .map((item) => item.split(/[/\\]/)[0])
      )]

      // Check each folder for the API
      for (const folder of folderNames) {
        const metadataPath = this.getMetadataPath(apiId, folder)
        if (await this.storage.exists(metadataPath)) {
          return folder
        }
      }

      return null
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to find API folder')
      return null
    }
  }

  /**
   * Gets metadata path for an API
   * @param apiId - API identifier
   * @param folder - Folder name (optional, defaults to finding the folder)
   * @returns Metadata file path
   * @description Where we keep the API's main file, now with folder support!
   */
  private getMetadataPath(apiId: ApiId, folder?: string): string {
    const targetFolder = folder || this.defaultFolder
    return `${targetFolder}/${apiId}/metadata.json`
  }

  /**
   * Gets metadata path for a specific version
   * @param apiId - API identifier
   * @param version - Version tag
   * @param folder - Folder name (optional, defaults to finding the folder)
   * @returns Version metadata file path
   * @description Where we keep the version's file, now with folder support!
   */
  private getVersionMetadataPath(apiId: ApiId, version: VersionTag, folder?: string): string {
    const targetFolder = folder || this.defaultFolder
    return `${targetFolder}/${apiId}/${version}/metadata.json`
  }

  /**
   * Deletes a version (use with extreme caution!)
   * @param apiId - API identifier
   * @param version - Version to delete
   * @returns Promise resolving when version is deleted
   * @description Removes a version from history. The nuclear option. ☢️
   */
  async deleteVersion(apiId: ApiId, version: VersionTag): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId)

      // Prevent deletion of current or stable versions
      if (metadata.current_version === version) {
        throw createValidationError('Cannot delete current version', 'version')
      }
      if (metadata.latest_stable === version) {
        throw createValidationError('Cannot delete latest stable version', 'version')
      }

      // Remove from versions list
      metadata.versions = metadata.versions.filter((v) => v !== version)

      const metadataPath = this.getMetadataPath(apiId)
      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.warn({ apiId, version }, 'Version deleted from API')

      return metadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to delete version')
      throw error
    }
  }
}

