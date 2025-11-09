/**
 * Version Control Tool
 *
 * @description This magnificent tool manages API versions like a seasoned conductor
 * leading an orchestra - creating versions, comparing them, and keeping everything
 * in perfect harmony. It's the time machine of your API specifications!
 *
 * Handles version listing, creation, comparison, deletion, and metadata management.
 * Think of it as Git for your OpenAPI specs, minus the merge conflicts (thankfully).
 */

import { BaseTool } from '../types/mcp-tool'
import type { ToolResult } from '../types/mcp-tool'
import type { ApiId, VersionTag } from '../types/openapi'
import type { SpecManager } from '../services/spec-manager'
import type { VersionManager } from '../services/version-manager'
import type { DiffCalculator } from '../services/diff-calculator'
import type { AuditLogger } from '../services/audit-logger'
import { createToolError } from '../utils/errors'
import {
  versionControlSchema,
  type VersionControlParams,
} from './schemas/version-control-schema'

/**
 * Version Control Tool Implementation
 *
 * @description Your one-stop shop for all things version management.
 * Creates versions, compares them, lists them, and generally keeps
 * your API evolution under control.
 */
export class VersionControlTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private versionManager: VersionManager,
    private diffCalculator: DiffCalculator,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  /**
   * Execute version control operation
   *
   * @description Routes your request to the appropriate version management handler.
   * It's like a postal service, but for API versions.
   */
  async execute(params: VersionControlParams): Promise<ToolResult> {
    this.validate(params, versionControlSchema)

    const { operation } = params

    try {
      switch (operation) {
        case 'list':
          return await this.handleList(params)
        case 'create':
          return await this.handleCreate(params)
        case 'get':
          return await this.handleGet(params)
        case 'compare':
          return await this.handleCompare(params)
        case 'set_current':
          return await this.handleSetCurrent(params)
        case 'delete':
          return await this.handleDelete(params)
        default:
          throw createToolError(
            `Unknown operation: ${operation}`,
            'VALIDATION_ERROR',
            params as any
          )
      }
    } catch (error) {
      throw createToolError(
        `Version control failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, operation }
      )
    }
  }

  /**
   * List all versions for an API
   *
   * @description Returns a comprehensive list of all versions with their metadata.
   * Like a family photo album, but for your API versions.
   */
  private async handleList(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'list') {
      throw createToolError('Invalid operation for handleList', 'VALIDATION_ERROR', params as any)
    }

    const { apiId } = params

    const versions = await this.versionManager.listVersions(apiId as ApiId)
    const apiMetadata = await this.versionManager.getApiMetadata(apiId as ApiId)

    return this.success(`Found ${versions.length} versions for ${apiId}`, {
      count: versions.length,
      versions,
      currentVersion: apiMetadata.current_version,
      latestStable: apiMetadata.latest_stable,
    })
  }

  /**
   * Create a new version
   *
   * @description Creates a new version, optionally copying from a source version.
   * It's like having a baby - you can start from scratch or clone an existing one.
   * (We recommend the cloning approach for API versions.)
   */
  private async handleCreate(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'create') {
      throw createToolError('Invalid operation for handleCreate', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, sourceVersion, description, llmReason } = params

    // Check if version already exists by getting API metadata
    try {
      const metadata = await this.versionManager.getApiMetadata(apiId as ApiId)
      if (metadata.versions.includes(version as VersionTag)) {
        throw createToolError(
          `Version ${version} already exists for ${apiId}`,
          'VALIDATION_ERROR',
          params as any
        )
      }
    } catch (error) {
      // API doesn't exist yet, that's fine for first version
    }

    let spec: any

    if (sourceVersion) {
      // Copy from source version
      const sourceSpec = await this.specManager.loadSpec(
        apiId as ApiId,
        sourceVersion as VersionTag
      )
      spec = (sourceSpec as any).spec || sourceSpec
    } else {
      // Create minimal new spec
      spec = {
        openapi: '3.0.0',
        info: {
          title: `${apiId} API`,
          version: version.replace('v', ''),
          description: description || 'API specification',
        },
        paths: {},
      }
    }

    // Save the new version
    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)

    // Create version metadata
    await this.versionManager.createVersionMetadata(
      apiId as ApiId,
      version as VersionTag,
      {
        version: version as VersionTag,
        created_at: new Date().toISOString(),
        created_by: 'mcp-tool',
        parent_version: (sourceVersion as VersionTag) || null,
        description: description || `Version ${version}`,
        changes: {
          endpoints_added: [],
          endpoints_modified: [],
          endpoints_deleted: [],
          schemas_added: [],
          schemas_modified: [],
          schemas_deleted: [],
          breaking_changes: [],
        },
        validation: {
          spectral_errors: 0,
          spectral_warnings: 0,
          openapi_valid: true,
        },
        stats: {
          endpoint_count: 0,
          schema_count: 0,
          file_size_bytes: 0,
        },
      }
    )

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'version_created',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        sourceVersion: sourceVersion || 'new',
        description: description || '',
      },
    })

    return this.success(`Created version ${version} for ${apiId}`, {
      version,
      apiId,
      sourceVersion: sourceVersion || null,
      description: description || null,
    })
  }

  /**
   * Get version details
   *
   * @description Retrieves detailed metadata about a specific version.
   * All the juicy details about when it was created, what changed, and who's to blame.
   */
  private async handleGet(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'get') {
      throw createToolError('Invalid operation for handleGet', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version } = params

    const metadata = await this.versionManager.getVersionMetadata(
      apiId as ApiId,
      version as VersionTag
    )

    return this.success(`Retrieved metadata for ${apiId} ${version}`, {
      version,
      metadata,
    })
  }

  /**
   * Compare two versions
   *
   * @description Compares two versions and returns a detailed diff with breaking changes.
   * Like a before-and-after photo, but with more endpoints and schemas.
   */
  private async handleCompare(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'compare') {
      throw createToolError(
        'Invalid operation for handleCompare',
        'VALIDATION_ERROR',
        params as any
      )
    }

    const { apiId, fromVersion, toVersion } = params

    // Load both versions
    const fromSpec = await this.specManager.loadSpec(apiId as ApiId, fromVersion as VersionTag)
    const toSpec = await this.specManager.loadSpec(apiId as ApiId, toVersion as VersionTag)

    // Calculate diff
    const changes = await this.diffCalculator.calculateDiff(fromSpec as any, toSpec as any)

    return this.success(`Compared ${fromVersion} to ${toVersion}`, {
      fromVersion,
      toVersion,
      changes,
      hasBreakingChanges: changes.breaking_changes.length > 0,
    })
  }

  /**
   * Set current version
   *
   * @description Updates the API metadata to mark a version as current.
   * Like changing the channel on your TV, but for API versions.
   */
  private async handleSetCurrent(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'set_current') {
      throw createToolError(
        'Invalid operation for handleSetCurrent',
        'VALIDATION_ERROR',
        params as any
      )
    }

    const { apiId, version, llmReason } = params

    // Verify version exists by checking API metadata
    const metadata = await this.versionManager.getApiMetadata(apiId as ApiId)
    if (!metadata.versions.includes(version as VersionTag)) {
      throw createToolError(
        `Version ${version} does not exist for ${apiId}`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    // Update API metadata
    await this.versionManager.setCurrentVersion(apiId as ApiId, version as VersionTag)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      event: 'version_set_current',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        version,
      },
    })

    return this.success(`Set ${version} as current version for ${apiId}`, {
      apiId,
      currentVersion: version,
    })
  }

  /**
   * Delete a version
   *
   * @description Removes a version and its metadata. Use with caution!
   * It's like the delete button, but with actual consequences.
   */
  private async handleDelete(params: VersionControlParams): Promise<ToolResult> {
    if (params.operation !== 'delete') {
      throw createToolError('Invalid operation for handleDelete', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, llmReason } = params

    // Check if it's the current version
    const apiMetadata = await this.versionManager.getApiMetadata(apiId as ApiId)
    if (apiMetadata.current_version === version) {
      throw createToolError(
        `Cannot delete current version ${version}. Set a different version as current first.`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    // Delete the spec
    await this.specManager.deleteSpec(apiId as ApiId, version as VersionTag)

    // Delete version metadata
    await this.versionManager.deleteVersion(apiId as ApiId, version as VersionTag)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      event: 'version_deleted',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        version,
      },
    })

    return this.success(`Deleted version ${version} for ${apiId}`, {
      apiId,
      deletedVersion: version,
    })
  }

  /**
   * Describe the tool for MCP registration
   *
   * @description Returns the tool description. It's like a resume, but for a tool.
   */
  describe() {
    return {
      name: 'version_control',
      description:
        'Manage API versions: list, create, compare, and delete versions. Handles version metadata, diffs between versions, and setting the current version. Your Swiss Army knife for API version management.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string', description: 'API identifier (kebab-case)' },
          operation: {
            type: 'string',
            enum: ['list', 'create', 'get', 'compare', 'set_current', 'delete'],
            description: 'Version control operation to perform',
          },
          version: {
            type: 'string',
            description: 'Version tag (format: v{major}.{minor}.{patch}) - required for create/get/set_current/delete',
          },
          sourceVersion: {
            type: 'string',
            description: 'Source version to copy from (optional for create)',
          },
          description: {
            type: 'string',
            description: 'Version description (optional for create)',
          },
          fromVersion: {
            type: 'string',
            description: 'Starting version for comparison (required for compare)',
          },
          toVersion: {
            type: 'string',
            description: 'Target version for comparison (required for compare)',
          },
          llmReason: {
            type: 'string',
            description: 'Optional: Why the LLM is performing this operation (for audit trail)',
          },
        },
        required: ['apiId', 'operation'],
      },
    }
  }
}

