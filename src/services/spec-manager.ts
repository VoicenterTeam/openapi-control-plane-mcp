/**
 * Spec Manager Service
 *
 * @description Core service for loading, saving, and managing OpenAPI specifications.
 * The librarian of your API specs - knows where everything is, keeps things organized,
 * and quietly judges your endpoint naming choices. 📚
 * Now with folder awareness for multi-workspace organization!
 *
 * @module services/spec-manager
 */

import SwaggerParser from '@apidevtools/swagger-parser'
import * as yaml from 'js-yaml'
import { type BaseStorageProvider } from '../storage/base-storage-provider.js'
import {
  type ApiId,
  type VersionTag,
  detectOpenAPIVersion,
  type OpenAPIDocument,
} from '../types/openapi.js'
import { createStorageError, StorageError, ToolError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Spec Manager Service
 * @description Manages OpenAPI specification storage and operations
 */
export class SpecManager {
  private defaultFolder: string = 'active'

  constructor(private storage: BaseStorageProvider, defaultFolder: string = 'active') {
    this.defaultFolder = defaultFolder
  }

  /**
   * Loads a specific version of an API spec
   * @param apiId - API identifier
   * @param version - Version tag (e.g., 'v1.0.0')
   * @param folder - Specific folder (optional, will search all if not provided)
   * @returns Promise resolving to the parsed OpenAPI document
   * @throws StorageError if spec doesn't exist or can't be read
   * @throws ToolError if spec is invalid
   * @description Reads the versioned spec file and parses it.
   * Like opening a specific edition of a book from your library.
   */
  async loadSpec(apiId: ApiId, version: VersionTag, folder?: string): Promise<OpenAPIDocument> {
    // If folder not specified, find where the API lives
    const targetFolder = folder || await this.findApiFolder(apiId) || this.defaultFolder
    
    const yamlPath = `${targetFolder}/${apiId}/${version}/spec.yaml`
    const jsonPath = `${targetFolder}/${apiId}/${version}/spec.json`

    try {
      // Try YAML first (preferred format)
      if (await this.storage.exists(yamlPath)) {
        const content = await this.storage.read(yamlPath)
        const spec = yaml.load(content) as object
        const parsedSpec = await SwaggerParser.parse(spec as any)
        const detectedVersion = detectOpenAPIVersion(parsedSpec)
        logger.debug({ apiId, version, folder: targetFolder, detectedVersion }, 'Loaded spec from YAML')
        return { version: detectedVersion, spec: parsedSpec } as OpenAPIDocument
      }

      // Fallback to JSON
      if (await this.storage.exists(jsonPath)) {
        const content = await this.storage.read(jsonPath)
        const spec = JSON.parse(content)
        const parsedSpec = await SwaggerParser.parse(spec as any)
        const detectedVersion = detectOpenAPIVersion(parsedSpec)
        logger.debug({ apiId, version, folder: targetFolder, detectedVersion }, 'Loaded spec from JSON')
        return { version: detectedVersion, spec: parsedSpec } as OpenAPIDocument
      }

      throw createStorageError(
        `Spec not found for API ${apiId} version ${version} in folder ${targetFolder}`,
        yamlPath,
        'read'
      )
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      logger.error({ apiId, version, folder: targetFolder, error }, 'Failed to load spec')
      throw createStorageError(
        `Failed to load spec for API ${apiId} version ${version}`,
        yamlPath,
        'read',
        error as Error
      )
    }
  }

  /**
   * Saves an API spec for a specific version
   * @param apiId - API identifier
   * @param version - Version tag
   * @param spec - OpenAPI specification to save
   * @param format - Output format (yaml or json)
   * @param folder - Specific folder (optional, will search all if not provided)
   * @description Saves spec using atomic writes to prevent corruption.
   */
  async saveSpec(
    apiId: ApiId,
    version: VersionTag,
    spec: object,
    format: 'yaml' | 'json' = 'yaml',
    folder?: string
  ): Promise<void> {
    // If folder not specified, find where the API lives
    const targetFolder = folder || await this.findApiFolder(apiId) || this.defaultFolder
    const specPath = `${targetFolder}/${apiId}/${version}/spec.${format}`

    try {
      // Ensure directory exists
      await this.storage.ensureDirectory(`${targetFolder}/${apiId}/${version}`)

      // Save spec
      const content = format === 'yaml' ? yaml.dump(spec) : JSON.stringify(spec, null, 2)
      await this.storage.write(specPath, content)

      logger.info({ apiId, version, format, folder: targetFolder }, 'Spec saved successfully')
    } catch (error) {
      logger.error({ apiId, version, folder: targetFolder, error }, 'Failed to save spec')
      throw createStorageError(
        `Failed to save spec for API ${apiId} version ${version}`,
        specPath,
        'write',
        error as Error
      )
    }
  }

  /**
   * Checks if a specific version of a spec exists
   * @param apiId - API identifier
   * @param version - Version tag
   * @returns True if the spec exists
   */
  async specExists(apiId: ApiId, version: VersionTag): Promise<boolean> {
    const yamlPath = `${apiId}/${version}/spec.yaml`
    const jsonPath = `${apiId}/${version}/spec.json`
    return (await this.storage.exists(yamlPath)) || (await this.storage.exists(jsonPath))
  }

  /**
   * Deletes a specific version of a spec
   * @param apiId - API identifier
   * @param version - Version tag
   * @throws StorageError if deletion fails
   */
  async deleteSpec(apiId: ApiId, version: VersionTag): Promise<void> {
    const yamlPath = `${apiId}/${version}/spec.yaml`
    const jsonPath = `${apiId}/${version}/spec.json`

    try {
      // Delete whichever format exists
      if (await this.storage.exists(yamlPath)) {
        await this.storage.delete(yamlPath)
      }
      if (await this.storage.exists(jsonPath)) {
        await this.storage.delete(jsonPath)
      }

      logger.info({ apiId, version }, 'Spec deleted successfully')
    } catch (error) {
      logger.error({ apiId, version, error }, 'Failed to delete spec')
      throw createStorageError(
        `Failed to delete spec for API ${apiId} version ${version}`,
        yamlPath,
        'delete',
        error as Error
      )
    }
  }

  /**
   * Parses a spec from string content
   * @param content - YAML or JSON string
   * @returns Parsed spec object
   * @throws ToolError if parsing fails
   * @description Auto-detects format and parses. Like a universal translator
   * but for API specs.
   */
  async parseSpec(content: string): Promise<object> {
    try {
      // Try JSON first (faster)
      return JSON.parse(content)
    } catch {
      // Fallback to YAML
      try {
        return yaml.load(content) as object
      } catch (error) {
        throw new ToolError('Failed to parse spec: Invalid YAML or JSON', {
          tool_name: 'spec_manager',
          cause: error as Error,
        })
      }
    }
  }

  /**
   * Validates an OpenAPI spec
   * @param spec - Specification to validate
   * @throws ToolError if validation fails
   * @description Uses @apidevtools/swagger-parser to validate the spec.
   * If this passes, your spec is at least structurally sound. Content quality
   * is your problem.
   */
  async validateSpec(spec: object): Promise<void> {
    try {
      await SwaggerParser.validate(spec as any)
    } catch (error) {
      throw new ToolError('Spec validation failed', {
        tool_name: 'spec_manager',
        params: { error: (error as Error).message },
        cause: error as Error,
      })
    }
  }

  /**
   * Lists all API IDs
   * @returns Promise resolving to array of API IDs
   * @description Scans the specs directory and returns all API identifiers.
   * The census taker of your API kingdom.
   */
  async listApis(): Promise<ApiId[]> {
    try {
      const files = await this.storage.list('specs/')
      // Extract unique API IDs from paths like "specs/my-api/current.yaml"
      const apiIds = new Set<string>()
      files.forEach(file => {
        const match = file.match(/^specs\/([^/]+)\//)
        if (match) apiIds.add(match[1])
      })
      return Array.from(apiIds) as ApiId[]
    } catch (error) {
      logger.error({ error }, 'Failed to list APIs')
      return []
    }
  }

  /**
   * Checks if an API exists
   * @param apiId - API identifier to check
   * @returns Promise resolving to true if API exists
   */
  async apiExists(apiId: ApiId): Promise<boolean> {
    const yamlPath = `${apiId}/current.yaml`
    const jsonPath = `${apiId}/current.json`
    return (await this.storage.exists(yamlPath)) || (await this.storage.exists(jsonPath))
  }

  /**
   * Finds which folder contains a specific API
   * @param apiId - API identifier
   * @returns Promise resolving to folder name or null if not found
   * @description Searches all folders to locate an API. Detective work for file systems.
   */
  private async findApiFolder(apiId: ApiId): Promise<string | null> {
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
        const metadataPath = `${folder}/${apiId}/metadata.json`
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

  // TODO: Implement createApi method with proper version handling
}


