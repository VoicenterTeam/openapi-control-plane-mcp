/**
 * Endpoint Management Tool
 *
 * @description This brave tool manages the paths section of your OpenAPI spec,
 * because apparently REST endpoints don't just spontaneously organize themselves.
 * Handles adding, updating, deleting, and listing endpoints with all the HTTP methods
 * your heart desires (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD, TRACE).
 *
 * This is the Swiss Army knife of endpoint management - it slices, it dices,
 * it makes julienne fries! Well, not really, but it does handle CRUD operations
 * on API paths with grace and humorous JSDoc comments.
 */

import { BaseTool } from '../types/mcp-tool'
import type { ToolResult } from '../types/mcp-tool'
import type { ApiId, VersionTag } from '../types/openapi'
import type { SpecManager } from '../services/spec-manager'
import type { AuditLogger } from '../services/audit-logger'
import { createToolError } from '../utils/errors'
import { endpointManageSchema, type EndpointManageParams } from './schemas/endpoint-manage-schema'

/**
 * HTTP methods supported by OpenAPI
 */
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const

/**
 * Endpoint Management Tool Implementation
 *
 * @description Manages OpenAPI endpoints with all the CRUD operations you need,
 * plus some you probably don't need but we included anyway for completeness.
 */
export class EndpointManageTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  /**
   * Execute the endpoint management operation
   *
   * @description The main entry point that figures out what you want to do
   * and delegates to the appropriate handler. It's like a traffic cop for endpoints.
   */
  async execute(params: EndpointManageParams): Promise<ToolResult> {
    this.validate(params, endpointManageSchema)

    const { operation } = params

    try {
      switch (operation) {
        case 'list':
          return await this.handleList(params)
        case 'add':
          return await this.handleAdd(params)
        case 'update':
          return await this.handleUpdate(params)
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
        `Endpoint management failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, version: params.version, operation }
      )
    }
  }

  /**
   * List all endpoints
   *
   * @description Returns a comprehensive list of all endpoints in the spec,
   * organized by path with all their HTTP methods. It's like a phone book,
   * but for REST APIs and hopefully more up-to-date.
   */
  private async handleList(params: EndpointManageParams): Promise<ToolResult> {
    const { apiId, version } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec || doc

    const paths = (spec as any).paths || {}
    const endpoints = Object.entries(paths).map(([path, pathItem]: [string, any]) => ({
      path,
      methods: Object.keys(pathItem).filter((key) => HTTP_METHODS.includes(key as any)),
      summary: this.getPathSummary(pathItem),
      operations: this.getOperationSummaries(pathItem),
    }))

    return this.success(`Found ${endpoints.length} endpoints`, {
      count: endpoints.length,
      endpoints,
    })
  }

  /**
   * Add a new endpoint
   *
   * @description Creates a new path and operation in the spec. If the path already exists,
   * it adds the method to it. If the method already exists on that path, it throws a tantrum
   * (well, an error, but same energy).
   */
  private async handleAdd(params: EndpointManageParams): Promise<ToolResult> {
    if (params.operation !== 'add') {
      throw createToolError('Invalid operation for handleAdd', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, operationObject, llmReason } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec || doc

    // Ensure paths exists
    if (!(spec as any).paths) {
      ;(spec as any).paths = {}
    }

    const paths = (spec as any).paths
    const normalizedMethod = (method as string).toLowerCase()

    // Check if path exists
    if (!paths[path as string]) {
      paths[path as string] = {}
    }

    // Check if method already exists
    if (paths[path as string][normalizedMethod]) {
      throw createToolError(
        `Endpoint ${(method as string).toUpperCase()} ${path} already exists`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    // Add the operation
    paths[path as string][normalizedMethod] = operationObject

    // Save the spec
    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec as any)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'endpoint_added',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: normalizedMethod,
        summary: operationObject.summary || 'No summary',
      },
    })

    return this.success(`Added endpoint ${(method as string).toUpperCase()} ${path}`, {
      path,
      method: normalizedMethod,
      operation: operationObject,
    })
  }

  /**
   * Update an existing endpoint
   *
   * @description Modifies an existing operation. You can update any part of it -
   * summary, description, parameters, responses, you name it. It's like plastic surgery
   * for your API endpoints, minus the recovery time.
   */
  private async handleUpdate(params: EndpointManageParams): Promise<ToolResult> {
    if (params.operation !== 'update') {
      throw createToolError('Invalid operation for handleUpdate', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, updates, llmReason } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec || doc

    const paths = (spec as any).paths
    const normalizedMethod = (method as string).toLowerCase()

    // Check if endpoint exists
    if (!paths || !paths[path as string] || !paths[path as string][normalizedMethod]) {
      throw createToolError(
        `Endpoint ${(method as string).toUpperCase()} ${path} not found`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    // Merge updates
    const oldOperation = paths[path as string][normalizedMethod]
    paths[path as string][normalizedMethod] = {
      ...oldOperation,
      ...(updates as Record<string, any>),
    }

    // Save the spec
    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec as any)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'endpoint_updated',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: normalizedMethod,
        updated_fields: Object.keys(updates as Record<string, any>),
      },
    })

    return this.success(`Updated endpoint ${(method as string).toUpperCase()} ${path}`, {
      path,
      method: normalizedMethod,
      updated: paths[path as string][normalizedMethod],
      changes: Object.keys(updates as Record<string, any>),
    })
  }

  /**
   * Delete an endpoint
   *
   * @description Removes an operation from the spec. If it's the last method on a path,
   * it removes the whole path too. It's like Marie Kondo for your API - if this endpoint
   * doesn't spark joy, thank it and let it go.
   */
  private async handleDelete(params: EndpointManageParams): Promise<ToolResult> {
    if (params.operation !== 'delete') {
      throw createToolError('Invalid operation for handleDelete', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, llmReason } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec || doc

    const paths = (spec as any).paths
    const normalizedMethod = (method as string).toLowerCase()

    // Check if endpoint exists
    if (!paths || !paths[path as string] || !paths[path as string][normalizedMethod]) {
      throw createToolError(
        `Endpoint ${(method as string).toUpperCase()} ${path} not found`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    // Store for audit
    const deletedOperation = paths[path as string][normalizedMethod]

    // Delete the method
    delete paths[path as string][normalizedMethod]

    // If path has no more methods, delete the path
    const remainingMethods = Object.keys(paths[path as string]).filter((key) =>
      HTTP_METHODS.includes(key as any)
    )
    if (remainingMethods.length === 0) {
      delete paths[path as string]
    }

    // Save the spec
    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec as any)

    // Log audit event
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'endpoint_deleted',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: normalizedMethod,
        summary: deletedOperation.summary || 'No summary',
      },
    })

    return this.success(`Deleted endpoint ${(method as string).toUpperCase()} ${path}`, {
      path,
      method: normalizedMethod,
      pathDeleted: remainingMethods.length === 0,
    })
  }

  /**
   * Get a summary of all operations on a path
   *
   * @description Helper to extract a human-readable summary from a path item.
   * If there are multiple operations, it concatenates them. If there's one,
   * it returns that. If there's none, it shrugs and says "No operations".
   */
  private getPathSummary(pathItem: any): string {
    const operations = Object.entries(pathItem)
      .filter(([key]) => HTTP_METHODS.includes(key as any))
      .map(([, op]: [string, any]) => op.summary)
      .filter(Boolean)

    if (operations.length === 0) return 'No operations'
    if (operations.length === 1) return operations[0]
    return `${operations.length} operations`
  }

  /**
   * Get detailed summaries of all operations
   *
   * @description Returns an object mapping HTTP methods to their summaries.
   * Useful for displaying a quick overview without drowning in details.
   */
  private getOperationSummaries(pathItem: any): Record<string, string> {
    const summaries: Record<string, string> = {}

    for (const method of HTTP_METHODS) {
      if (pathItem[method]) {
        summaries[method] = pathItem[method].summary || 'No summary'
      }
    }

    return summaries
  }

  /**
   * Describe the tool for MCP registration
   *
   * @description Returns the tool description that MCP uses to understand
   * what this tool does. Think of it as a dating profile, but for a tool.
   */
  describe() {
    return {
      name: 'endpoint_manage',
      description:
        'Manage OpenAPI endpoints (paths and operations). List all endpoints, add new endpoints with operations, update existing endpoint operations, or delete endpoints. This is your primary tool for managing the paths section of an OpenAPI spec.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string', description: 'API identifier (kebab-case)' },
          version: {
            type: 'string',
            description: 'Version tag (format: v{major}.{minor}.{patch} or timestamp)',
          },
          operation: {
            type: 'string',
            enum: ['list', 'add', 'update', 'delete'],
            description: 'Operation to perform',
          },
          path: {
            type: 'string',
            description: 'API path (e.g., /users/{id}) - required for add/update/delete',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE'],
            description: 'HTTP method - required for add/update/delete',
          },
          operationObject: {
            type: 'object',
            description:
              'Full operation object (summary, description, parameters, responses, etc.) - required for add',
          },
          updates: {
            type: 'object',
            description: 'Partial operation updates to merge - required for update',
          },
          llmReason: {
            type: 'string',
            description: 'Optional: Why the LLM is making this change (for audit trail)',
          },
        },
        required: ['apiId', 'version', 'operation'],
      },
    }
  }
}

