/**
 * Version Manager Service
 *
 * @description Manages OpenAPI specification versions with style and grace.
 * Like a librarian but for API versions. Organized chaos at its finest. 📚🔖
 *
 * @module services/version-manager
 */

import type { ApiId, VersionTag } from '../types/openapi'
import type { ApiMetadata, VersionMetadata } from '../types/metadata'
import type { BaseStorageProvider } from '../storage/base-storage-provider'
import { logger } from '../utils/logger'
import { createStorageError, createValidationError } from '../utils/errors'

/**
 * Version Manager Service
 * @description Manages versions of OpenAPI specifications. The version control system.
 * Keeps track of what came before, what is now, and what's coming next. 🕰️
 */
export class VersionManager {
  private storage: BaseStorageProvider

  /**
   * Creates a new version manager
   * @param storage - Storage provider for metadata
   * @description Sets up the version management system
   */
  constructor(storage: BaseStorageProvider) {
    this.storage = storage
  }

  /**
   * Creates API metadata entry for a new API
   * @param apiId - API identifier
   * @param name - Human-readable API name
   * @param owner - Owner/team responsible
   * @param initialVersion - First version tag
   * @returns Promise resolving to created metadata
   * @description Initializes a new API in the system. Birth certificate for APIs.
   */
  async createApiMetadata(
    apiId: ApiId,
    name: string,
    owner: string,
    initialVersion: VersionTag
  ): Promise<ApiMetadata> {
    try {
      const metadataPath = this.getMetadataPath(apiId)

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
      }

      await this.storage.write(metadataPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, name, owner, initialVersion }, 'API metadata created')

      return metadata
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to create API metadata')
      throw error
    }
  }

  /**
   * Retrieves API metadata
   * @param apiId - API identifier
   * @returns Promise resolving to API metadata
   * @description Gets the API's vital statistics
   */
  async getApiMetadata(apiId: ApiId): Promise<ApiMetadata> {
    try {
      const metadataPath = this.getMetadataPath(apiId)
      const data = await this.storage.read(metadataPath)
      return JSON.parse(data) as ApiMetadata
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to retrieve API metadata')
      throw createStorageError(
        `Failed to retrieve API metadata: ${(error as Error).message}`,
        this.getMetadataPath(apiId),
        'read'
      )
    }
  }

  /**
   * Updates API metadata
   * @param apiId - API identifier
   * @param updates - Partial metadata updates
   * @returns Promise resolving to updated metadata
   * @description Updates API information. For when things change.
   */
  async updateApiMetadata(
    apiId: ApiId,
    updates: Partial<Omit<ApiMetadata, 'api_id' | 'created_at'>>
  ): Promise<ApiMetadata> {
    try {
      const metadata = await this.getApiMetadata(apiId)
      const updated = { ...metadata, ...updates }

      const metadataPath = this.getMetadataPath(apiId)
      await this.storage.write(metadataPath, JSON.stringify(updated, null, 2))

      logger.info({ apiId, updates }, 'API metadata updated')

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
   * @returns Promise resolving when metadata is saved
   * @description Records detailed info about a specific version. The version's dossier.
   */
  async createVersionMetadata(
    apiId: ApiId,
    version: VersionTag,
    metadata: VersionMetadata
  ): Promise<void> {
    try {
      const versionPath = this.getVersionMetadataPath(apiId, version)
      await this.storage.write(versionPath, JSON.stringify(metadata, null, 2))

      logger.info({ apiId, version }, 'Version metadata created')
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to create version metadata')
      throw createStorageError(
        `Failed to create version metadata: ${(error as Error).message}`,
        this.getVersionMetadataPath(apiId, version),
        'write'
      )
    }
  }

  /**
   * Retrieves version-specific metadata
   * @param apiId - API identifier
   * @param version - Version tag
   * @returns Promise resolving to version metadata
   * @description Gets the details about a specific version
   */
  async getVersionMetadata(apiId: ApiId, version: VersionTag): Promise<VersionMetadata> {
    try {
      const versionPath = this.getVersionMetadataPath(apiId, version)
      const data = await this.storage.read(versionPath)
      return JSON.parse(data) as VersionMetadata
    } catch (error) {
      logger.error({ error, apiId, version }, 'Failed to retrieve version metadata')
      throw createStorageError(
        `Failed to retrieve version metadata: ${(error as Error).message}`,
        this.getVersionMetadataPath(apiId, version),
        'read'
      )
    }
  }

  /**
   * Gets metadata path for an API
   * @param apiId - API identifier
   * @returns Metadata file path
   * @description Where we keep the API's main file
   */
  private getMetadataPath(apiId: ApiId): string {
    return `${apiId}/metadata.json`
  }

  /**
   * Gets metadata path for a specific version
   * @param apiId - API identifier
   * @param version - Version tag
   * @returns Version metadata file path
   * @description Where we keep the version's file
   */
  private getVersionMetadataPath(apiId: ApiId, version: VersionTag): string {
    return `${apiId}/${version}/metadata.json`
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

