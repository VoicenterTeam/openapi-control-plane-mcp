/**
 * Metadata Update Tool
 *
 * @description MCP tool for updating API metadata (info section).
 * The first write tool! Like learning to crawl before you run,
 * except this crawl is more like a confident swagger. 🚶‍♂️
 *
 * @module tools/metadata-update-tool
 */

import { z } from 'zod'
import { BaseTool, type BaseToolParams, type ToolResult, type ToolDescription } from '../types/mcp-tool.js'
import { SpecManager } from '../services/spec-manager.js'
import { AuditLogger } from '../services/audit-logger.js'
import { validateApiId, validateVersionTag } from '../utils/validation.js'
import { createApiId, createVersionTag } from '../types/openapi.js'
import { createToolError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Parameters for metadata_update tool
 */
interface MetadataUpdateParams extends BaseToolParams {
  apiId: string
  version: string
  updates: {
    title?: string
    version?: string
    description?: string
    termsOfService?: string
    contact?: {
      name?: string
      url?: string
      email?: string
    }
    license?: {
      name?: string
      url?: string
    }
    /** Custom x- extensions */
    extensions?: Record<string, unknown>
  }
}

/**
 * Schema for metadata_update parameters
 */
const metadataUpdateSchema = z.object({
  apiId: z.string().describe('API identifier'),
  version: z.string().describe('Version tag (e.g., v1.0.0)'),
  updates: z.object({
    title: z.string().optional().describe('API title'),
    version: z.string().optional().describe('API version string'),
    description: z.string().optional().describe('API description'),
    termsOfService: z.string().url().optional().describe('Terms of service URL'),
    contact: z.object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      email: z.string().email().optional(),
    }).optional().describe('Contact information'),
    license: z.object({
      name: z.string().optional(),
      url: z.string().url().optional(),
    }).optional().describe('License information'),
    extensions: z.record(z.unknown()).optional().describe('Custom x- extensions (e.g., x-logo, x-category)'),
  }).describe('Metadata updates to apply'),
  llmReason: z.string().optional().describe('Optional reason from LLM for this update'),
})

/**
 * Metadata Update Tool
 * @description Updates API metadata (info section) with validation and audit logging.
 * Like editing a book's title page - important stuff!
 */
export class MetadataUpdateTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  /**
   * Executes the metadata update
   */
  async execute(params: MetadataUpdateParams): Promise<ToolResult> {
    try {
      // Validate parameters
      this.validate(params, metadataUpdateSchema)
      validateApiId(params.apiId)
      validateVersionTag(params.version)

      const apiId = createApiId(params.apiId)
      const version = createVersionTag(params.version)

      logger.info({ apiId, version, updates: params.updates }, 'Executing metadata_update tool')

      // Load current spec
      const specDoc = await this.specManager.loadSpec(apiId, version)
      const spec = 'spec' in specDoc ? specDoc.spec : specDoc

      // Validate spec has info section
      if (!spec.info) {
        throw createToolError(
          'Spec does not have an info section',
          'metadata_update',
          params as any
        )
      }

      // Store original for audit
      const originalInfo = JSON.parse(JSON.stringify(spec.info))

      // Apply updates
      const updatedInfo = this.applyUpdates(spec.info, params.updates)
      spec.info = updatedInfo

      // Save updated spec
      await this.specManager.saveSpec(apiId, version, spec)

      // Log audit event
      await this.auditLogger.logEvent({
        api_id: apiId,
        version,
        timestamp: new Date().toISOString(),
        event: 'metadata_update',
        user: 'system', // TODO: Replace with actual user when auth is implemented
        details: {
          action: 'update_info',
          updates: params.updates,
          original: originalInfo,
          updated: updatedInfo,
        },
        llm_reason: params.llmReason,
      })

      logger.info({ apiId, version }, 'Metadata updated successfully')

      return this.success('Metadata updated successfully', {
        apiId,
        version,
        updated: updatedInfo,
        changes: this.summarizeChanges(originalInfo, updatedInfo),
      })
    } catch (error) {
      logger.error({ error, params }, 'metadata_update tool failed')
      throw createToolError(
        (error as Error).message,
        'metadata_update',
        params as any,
        error as Error
      )
    }
  }

  /**
   * Applies updates to the info section
   */
  private applyUpdates(currentInfo: any, updates: MetadataUpdateParams['updates']): any {
    const updated = { ...currentInfo }

    // Apply simple string fields
    if (updates.title !== undefined) updated.title = updates.title
    if (updates.version !== undefined) updated.version = updates.version
    if (updates.description !== undefined) updated.description = updates.description
    if (updates.termsOfService !== undefined) updated.termsOfService = updates.termsOfService

    // Apply contact updates
    if (updates.contact) {
      updated.contact = updated.contact || {}
      if (updates.contact.name !== undefined) updated.contact.name = updates.contact.name
      if (updates.contact.url !== undefined) updated.contact.url = updates.contact.url
      if (updates.contact.email !== undefined) updated.contact.email = updates.contact.email
    }

    // Apply license updates
    if (updates.license) {
      updated.license = updated.license || {}
      if (updates.license.name !== undefined) updated.license.name = updates.license.name
      if (updates.license.url !== undefined) updated.license.url = updates.license.url
    }

    // Apply custom extensions (x- prefixed)
    if (updates.extensions) {
      Object.entries(updates.extensions).forEach(([key, value]) => {
        // Ensure key starts with 'x-'
        const extensionKey = key.startsWith('x-') ? key : `x-${key}`
        updated[extensionKey] = value
      })
    }

    return updated
  }

  /**
   * Summarizes changes for audit log
   */
  private summarizeChanges(original: any, updated: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {}

    // Check all possible fields
    const fieldsToCheck = ['title', 'version', 'description', 'termsOfService']
    
    fieldsToCheck.forEach(field => {
      if (original[field] !== updated[field]) {
        changes[field] = { from: original[field], to: updated[field] }
      }
    })

    // Check contact changes
    if (JSON.stringify(original.contact) !== JSON.stringify(updated.contact)) {
      changes.contact = { from: original.contact, to: updated.contact }
    }

    // Check license changes
    if (JSON.stringify(original.license) !== JSON.stringify(updated.license)) {
      changes.license = { from: original.license, to: updated.license }
    }

    // Check for x- extension changes
    Object.keys(updated).forEach(key => {
      if (key.startsWith('x-') && original[key] !== updated[key]) {
        changes[key] = { from: original[key], to: updated[key] }
      }
    })

    return changes
  }

  /**
   * Returns tool description for MCP registration
   */
  describe(): ToolDescription {
    return {
      name: 'metadata_update',
      description: 'Update API metadata (info section) including title, description, contact, license, and custom x- extensions. All updates are validated and logged for audit purposes.',
      inputSchema: metadataUpdateSchema,
    }
  }
}

