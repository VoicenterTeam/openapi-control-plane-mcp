/**
 * Schema Management Tool
 *
 * @description MCP tool for managing OpenAPI schema definitions (components.schemas).
 * The architect of data structures - building the blueprints for your API. 🏗️
 *
 * @module tools/schema-manage-tool
 */

import { z } from 'zod'
import { BaseTool, type BaseToolParams, type ToolResult, type ToolDescription } from '../types/mcp-tool'
import { SpecManager } from '../services/spec-manager'
import { AuditLogger } from '../services/audit-logger'
import { validateApiId, validateVersionTag } from '../utils/validation'
import { createApiId, createVersionTag } from '../types/openapi'
import { createToolError } from '../utils/errors'
import { logger } from '../utils/logger'

/**
 * Parameters for schema_manage tool
 */
interface SchemaManageParams extends BaseToolParams {
  apiId: string
  version: string
  operation: 'add' | 'update' | 'delete' | 'list'
  schemaName?: string
  schema?: {
    type?: string
    properties?: Record<string, unknown>
    required?: string[]
    description?: string
    example?: unknown
    additionalProperties?: boolean | object
    enum?: unknown[]
    items?: unknown
    allOf?: unknown[]
    anyOf?: unknown[]
    oneOf?: unknown[]
    not?: unknown
    format?: string
    pattern?: string
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
    [key: string]: unknown // Allow x- extensions
  }
}

/**
 * Schema for schema_manage parameters
 */
const schemaManageSchema = z.object({
  apiId: z.string().describe('API identifier'),
  version: z.string().describe('Version tag (e.g., v1.0.0)'),
  operation: z.enum(['add', 'update', 'delete', 'list']).describe('Operation to perform'),
  schemaName: z.string().optional().describe('Schema name (required for add/update/delete)'),
  schema: z.record(z.unknown()).optional().describe('Schema definition (required for add/update)'),
  llmReason: z.string().optional().describe('Optional reason from LLM for this operation'),
})

/**
 * Schema Management Tool
 * @description Manages schema definitions in the components.schemas section.
 * Like a librarian organizing the reference section - everything in its place!
 */
export class SchemaManageTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  /**
   * Executes the schema management operation
   */
  async execute(params: SchemaManageParams): Promise<ToolResult> {
    try {
      // Validate parameters
      this.validate(params, schemaManageSchema)
      validateApiId(params.apiId)
      validateVersionTag(params.version)

      const apiId = createApiId(params.apiId)
      const version = createVersionTag(params.version)

      logger.info({ apiId, version, operation: params.operation }, 'Executing schema_manage tool')

      // Route to appropriate handler
      switch (params.operation) {
        case 'list':
          return await this.handleList(apiId, version)
        case 'add':
          return await this.handleAdd(apiId, version, params)
        case 'update':
          return await this.handleUpdate(apiId, version, params)
        case 'delete':
          return await this.handleDelete(apiId, version, params)
        default:
          throw createToolError(
            `Unknown operation: ${params.operation}`,
            'schema_manage',
            params as any
          )
      }
    } catch (error) {
      logger.error({ error, params }, 'schema_manage tool failed')
      throw createToolError(
        (error as Error).message,
        'schema_manage',
        params as any,
        error as Error
      )
    }
  }

  /**
   * Lists all schemas
   */
  private async handleList(apiId: any, version: any): Promise<ToolResult> {
    const specDoc = await this.specManager.loadSpec(apiId, version)
    const spec = 'spec' in specDoc ? specDoc.spec : specDoc

    const schemas = (spec as any).components?.schemas || (spec as any).definitions || {}
    const schemaNames = Object.keys(schemas)

    return this.success(`Found ${schemaNames.length} schemas`, {
      count: schemaNames.length,
      schemas: schemaNames,
      definitions: schemas,
    })
  }

  /**
   * Adds a new schema
   */
  private async handleAdd(apiId: any, version: any, params: SchemaManageParams): Promise<ToolResult> {
    if (!params.schemaName) {
      throw createToolError('schemaName is required for add operation', 'schema_manage', params as any)
    }
    if (!params.schema) {
      throw createToolError('schema is required for add operation', 'schema_manage', params as any)
    }

    const specDoc = await this.specManager.loadSpec(apiId, version)
    const spec = 'spec' in specDoc ? specDoc.spec : specDoc

    // Ensure components.schemas exists
    if (!(spec as any).components) {
      (spec as any).components = {}
    }
    if (!(spec as any).components.schemas) {
      (spec as any).components.schemas = {}
    }

    // Check if schema already exists
    if ((spec as any).components.schemas[params.schemaName]) {
      throw createToolError(
        `Schema '${params.schemaName}' already exists. Use 'update' to modify it.`,
        'schema_manage',
        params as any
      )
    }

    // Add schema
    (spec as any).components.schemas[params.schemaName] = params.schema

    // Save spec
    await this.specManager.saveSpec(apiId, version, spec)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId,
      version,
      timestamp: new Date().toISOString(),
      event: 'schema_add',
      user: 'system',
      details: {
        schemaName: params.schemaName,
        schema: params.schema,
      },
      llm_reason: params.llmReason,
    })

    logger.info({ apiId, version, schemaName: params.schemaName }, 'Schema added successfully')

    return this.success(`Schema '${params.schemaName}' added successfully`, {
      schemaName: params.schemaName,
      schema: params.schema,
    })
  }

  /**
   * Updates an existing schema
   */
  private async handleUpdate(apiId: any, version: any, params: SchemaManageParams): Promise<ToolResult> {
    if (!params.schemaName) {
      throw createToolError('schemaName is required for update operation', 'schema_manage', params as any)
    }
    if (!params.schema) {
      throw createToolError('schema is required for update operation', 'schema_manage', params as any)
    }

    const specDoc = await this.specManager.loadSpec(apiId, version)
    const spec = 'spec' in specDoc ? specDoc.spec : specDoc

    // Check if schema exists
    const schemas = (spec as any).components?.schemas || (spec as any).definitions || {}
    if (!schemas[params.schemaName]) {
      throw createToolError(
        `Schema '${params.schemaName}' not found. Use 'add' to create it.`,
        'schema_manage',
        params as any
      )
    }

    const originalSchema = JSON.parse(JSON.stringify(schemas[params.schemaName]))

    // Update schema (merge with existing)
    schemas[params.schemaName] = {
      ...schemas[params.schemaName],
      ...params.schema,
    }

    // Save spec
    await this.specManager.saveSpec(apiId, version, spec)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId,
      version,
      timestamp: new Date().toISOString(),
      event: 'schema_update',
      user: 'system',
      details: {
        schemaName: params.schemaName,
        original: originalSchema,
        updated: schemas[params.schemaName],
      },
      llm_reason: params.llmReason,
    })

    logger.info({ apiId, version, schemaName: params.schemaName }, 'Schema updated successfully')

    return this.success(`Schema '${params.schemaName}' updated successfully`, {
      schemaName: params.schemaName,
      original: originalSchema,
      updated: schemas[params.schemaName],
    })
  }

  /**
   * Deletes a schema
   */
  private async handleDelete(apiId: any, version: any, params: SchemaManageParams): Promise<ToolResult> {
    if (!params.schemaName) {
      throw createToolError('schemaName is required for delete operation', 'schema_manage', params as any)
    }

    const specDoc = await this.specManager.loadSpec(apiId, version)
    const spec = 'spec' in specDoc ? specDoc.spec : specDoc

    // Check if schema exists
    const schemas = (spec as any).components?.schemas || (spec as any).definitions || {}
    if (!schemas[params.schemaName]) {
      throw createToolError(
        `Schema '${params.schemaName}' not found.`,
        'schema_manage',
        params as any
      )
    }

    const deletedSchema = JSON.parse(JSON.stringify(schemas[params.schemaName]))

    // Delete schema
    delete schemas[params.schemaName]

    // Save spec
    await this.specManager.saveSpec(apiId, version, spec)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId,
      version,
      timestamp: new Date().toISOString(),
      event: 'schema_delete',
      user: 'system',
      details: {
        schemaName: params.schemaName,
        deletedSchema,
      },
      llm_reason: params.llmReason,
    })

    logger.info({ apiId, version, schemaName: params.schemaName }, 'Schema deleted successfully')

    return this.success(`Schema '${params.schemaName}' deleted successfully`, {
      schemaName: params.schemaName,
      deleted: deletedSchema,
    })
  }

  /**
   * Returns tool description for MCP registration
   */
  describe(): ToolDescription {
    return {
      name: 'schema_manage',
      description: 'Manage OpenAPI schema definitions (components.schemas). Supports add, update, delete, and list operations. All changes are validated and logged for audit purposes.',
      inputSchema: schemaManageSchema,
    }
  }
}

