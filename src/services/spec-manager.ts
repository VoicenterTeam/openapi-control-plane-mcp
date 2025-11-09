/**
 * Spec Manager Service
 *
 * @description Core service for loading, saving, and managing OpenAPI specifications.
 * The librarian of your API specs - knows where everything is, keeps things organized,
 * and quietly judges your endpoint naming choices. 📚
 *
 * @module services/spec-manager
 */

import SwaggerParser from '@apidevtools/swagger-parser'
import * as yaml from 'js-yaml'
import { type BaseStorageProvider } from '../storage/base-storage-provider'
import { type ApiId, detectOpenAPIVersion, type OpenAPIDocument } from '../types/openapi'
import { createStorageError, ToolError } from '../utils/errors'
import { logger } from '../utils/logger'

/**
 * Spec Manager Service
 * @description Manages OpenAPI specification storage and operations
 */
export class SpecManager {
  constructor(private storage: BaseStorageProvider) {}

  /**
   * Loads the current version of an API spec
   * @param apiId - API identifier
   * @returns Promise resolving to the parsed OpenAPI document
   * @throws StorageError if spec doesn't exist or can't be read
   * @throws ToolError if spec is invalid
   * @description Reads current.yaml (or current.json) and parses it.
   * Like opening a book, but digital and with less papercutting risk.
   */
  async loadSpec(apiId: ApiId): Promise<OpenAPIDocument> {
    const yamlPath = `specs/${apiId}/current.yaml`
    const jsonPath = `specs/${apiId}/current.json`

    try {
      // Try YAML first (preferred format)
      if (await this.storage.exists(yamlPath)) {
        const content = await this.storage.read(yamlPath)
        const spec = yaml.load(content) as object
        await this.validateSpec(spec)
        const version = detectOpenAPIVersion(spec)
        return { version, spec } as OpenAPIDocument
      }

      // Fallback to JSON
      if (await this.storage.exists(jsonPath)) {
        const content = await this.storage.read(jsonPath)
        const spec = JSON.parse(content)
        await this.validateSpec(spec)
        const version = detectOpenAPIVersion(spec)
        return { version, spec } as OpenAPIDocument
      }

      throw createStorageError(`Spec not found: ${apiId}`, yamlPath, 'read')
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      logger.error({ apiId, error }, 'Failed to load spec')
      throw new ToolError(`Failed to load spec for API: ${apiId}`, {
        tool_name: 'spec_manager',
        cause: error as Error,
      })
    }
  }

  /**
   * Saves an API spec
   * @param apiId - API identifier
   * @param spec - OpenAPI specification to save
   * @param format - Output format (yaml or json)
   * @description Saves spec as current.yaml or current.json using atomic writes.
   * Creates a backup of the previous version automatically.
   */
  async saveSpec(
    apiId: ApiId,
    spec: object,
    format: 'yaml' | 'json' = 'yaml'
  ): Promise<void> {
    const currentPath = `specs/${apiId}/current.${format}`
    const backupPath = `specs/${apiId}/current.${format}.backup`

    try {
      // Validate before saving
      await this.validateSpec(spec)

      // Backup existing file if it exists
      if (await this.storage.exists(currentPath)) {
        const existing = await this.storage.read(currentPath)
        await this.storage.write(backupPath, existing)
      }

      // Save new spec
      const content = format === 'yaml' ? yaml.dump(spec) : JSON.stringify(spec, null, 2)
      await this.storage.write(currentPath, content)

      logger.info({ apiId, format }, 'Spec saved successfully')
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to save spec')
      throw new ToolError(`Failed to save spec for API: ${apiId}`, {
        tool_name: 'spec_manager',
        cause: error as Error,
      })
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
      await SwaggerParser.validate(spec as Parameters<typeof SwaggerParser.validate>[0])
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
    const yamlPath = `specs/${apiId}/current.yaml`
    const jsonPath = `specs/${apiId}/current.json`
    return (await this.storage.exists(yamlPath)) || (await this.storage.exists(jsonPath))
  }

  /**
   * Creates a new API with initial spec
   * @param apiId - API identifier
   * @param initialSpec - Initial OpenAPI specification
   * @description Initializes a new API with folder structure and initial spec.
   * Like creating a new folder, but with more ceremony.
   */
  async createApi(apiId: ApiId, initialSpec: object): Promise<void> {
    try {
      // Ensure API directory exists
      await this.storage.ensureDirectory(`specs/${apiId}`)
      await this.storage.ensureDirectory(`specs/${apiId}/versions`)

      // Save initial spec
      await this.saveSpec(apiId, initialSpec, 'yaml')

      logger.info({ apiId }, 'API created successfully')
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to create API')
      throw new ToolError(`Failed to create API: ${apiId}`, {
        tool_name: 'spec_manager',
        cause: error as Error,
      })
    }
  }
}

