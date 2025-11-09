/**
 * Parameters Configure Tool
 *
 * @description Manages parameters in OpenAPI specs. Query params, path params, headers -
 * all the little details that make APIs actually work. It's like organizing a kitchen:
 * everything has its place, and mixing them up leads to chaos.
 *
 * Handles parameters at both path-level (shared across operations) and operation-level.
 */

import { BaseTool } from '../types/mcp-tool.js'
import type { ToolResult } from '../types/mcp-tool.js'
import type { ApiId, VersionTag } from '../types/openapi.js'
import type { SpecManager } from '../services/spec-manager.js'
import type { AuditLogger } from '../services/audit-logger.js'
import { createToolError } from '../utils/errors.js'
import {
  parametersConfigureSchema,
  type ParametersConfigureParams,
} from './schemas/parameters-configure-schema.js'

/**
 * Parameters Configure Tool Implementation
 *
 * @description Your parameter management Swiss Army knife. Add 'em, update 'em,
 * delete 'em, list 'em. Parameters have never been so well managed.
 */
export class ParametersConfigureTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  /**
   * Execute parameters configure operation
   *
   * @description Routes to the appropriate handler based on operation type.
   */
  async execute(params: ParametersConfigureParams): Promise<ToolResult> {
    this.validate(params, parametersConfigureSchema)

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
        `Parameters configure failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, operation }
      )
    }
  }

  /**
   * List parameters
   *
   * @description Lists all parameters for a path or specific operation.
   */
  private async handleList(params: ParametersConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'list') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths || !spec.paths[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const pathItem = spec.paths[path as string]
    const parameters: any[] = []

    // Get path-level parameters
    if (pathItem.parameters) {
      parameters.push(
        ...pathItem.parameters.map((p: any) => ({ ...p, level: 'path' }))
      )
    }

    // Get operation-level parameters if method specified
    if (method) {
      const normalizedMethod = (method as string).toLowerCase()
      const operation = pathItem[normalizedMethod]

      if (operation && operation.parameters) {
        parameters.push(
          ...operation.parameters.map((p: any) => ({ ...p, level: 'operation' }))
        )
      }
    }

    return this.success(`Found ${parameters.length} parameters`, {
      path,
      method: method || 'all',
      count: parameters.length,
      parameters,
    })
  }

  /**
   * Add parameter
   *
   * @description Adds a parameter to a path or operation. Like adding seasoning -
   * you need to know where and how much.
   */
  private async handleAdd(params: ParametersConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'add') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, parameter, llmReason } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths || !spec.paths[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const pathItem = spec.paths[path as string]

    if (method) {
      // Add to operation level
      const normalizedMethod = (method as string).toLowerCase()
      if (!pathItem[normalizedMethod]) {
        throw createToolError(
          `Method ${method} not found on ${path}`,
          'VALIDATION_ERROR',
          params as any
        )
      }

      if (!pathItem[normalizedMethod].parameters) {
        pathItem[normalizedMethod].parameters = []
      }

      // Check for duplicates
      const existing = pathItem[normalizedMethod].parameters.find(
        (p: any) => p.name === parameter.name && p.in === parameter.in
      )
      if (existing) {
        throw createToolError(
          `Parameter ${parameter.name} in ${parameter.in} already exists`,
          'VALIDATION_ERROR',
          params as any
        )
      }

      pathItem[normalizedMethod].parameters.push(parameter)
    } else {
      // Add to path level
      if (!pathItem.parameters) {
        pathItem.parameters = []
      }

      const existing = pathItem.parameters.find(
        (p: any) => p.name === parameter.name && p.in === parameter.in
      )
      if (existing) {
        throw createToolError(
          `Parameter ${parameter.name} in ${parameter.in} already exists`,
          'VALIDATION_ERROR',
          params as any
        )
      }

      pathItem.parameters.push(parameter)
    }

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)

    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'parameter_added',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: method || 'path-level',
        parameterName: parameter.name,
        parameterIn: parameter.in,
      },
    })

    return this.success(`Added parameter ${parameter.name}`, {
      path,
      method: method || 'path-level',
      parameter,
    })
  }

  /**
   * Update parameter
   *
   * @description Updates an existing parameter. Finding the right needle in the
   * haystack and giving it a makeover.
   */
  private async handleUpdate(params: ParametersConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'update') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, parameterName, parameterIn, updates, llmReason } =
      params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths || !spec.paths[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const pathItem = spec.paths[path as string]
    let parameterFound = false

    if (method) {
      // Update at operation level
      const normalizedMethod = (method as string).toLowerCase()
      if (!pathItem[normalizedMethod]) {
        throw createToolError(
          `Method ${method} not found on ${path}`,
          'VALIDATION_ERROR',
          params as any
        )
      }

      if (pathItem[normalizedMethod].parameters) {
        const param = pathItem[normalizedMethod].parameters.find(
          (p: any) => p.name === parameterName && p.in === parameterIn
        )
        if (param) {
          Object.assign(param, updates)
          parameterFound = true
        }
      }
    } else {
      // Update at path level
      if (pathItem.parameters) {
        const param = pathItem.parameters.find(
          (p: any) => p.name === parameterName && p.in === parameterIn
        )
        if (param) {
          Object.assign(param, updates)
          parameterFound = true
        }
      }
    }

    if (!parameterFound) {
      throw createToolError(
        `Parameter ${parameterName} in ${parameterIn} not found`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)

    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'parameter_updated',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: method || 'path-level',
        parameterName,
        parameterIn,
        updates,
      },
    })

    return this.success(`Updated parameter ${parameterName}`, {
      path,
      method: method || 'path-level',
      parameterName,
      parameterIn,
      updates,
    })
  }

  /**
   * Delete parameter
   *
   * @description Removes a parameter. Gone, but not forgotten (it's in the audit log).
   */
  private async handleDelete(params: ParametersConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'delete') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, parameterName, parameterIn, llmReason } = params

    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths || !spec.paths[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const pathItem = spec.paths[path as string]
    let parameterFound = false

    if (method) {
      // Delete from operation level
      const normalizedMethod = (method as string).toLowerCase()
      if (!pathItem[normalizedMethod]) {
        throw createToolError(
          `Method ${method} not found on ${path}`,
          'VALIDATION_ERROR',
          params as any
        )
      }

      if (pathItem[normalizedMethod].parameters) {
        const index = pathItem[normalizedMethod].parameters.findIndex(
          (p: any) => p.name === parameterName && p.in === parameterIn
        )
        if (index !== -1) {
          pathItem[normalizedMethod].parameters.splice(index, 1)
          parameterFound = true
        }
      }
    } else {
      // Delete from path level
      if (pathItem.parameters) {
        const index = pathItem.parameters.findIndex(
          (p: any) => p.name === parameterName && p.in === parameterIn
        )
        if (index !== -1) {
          pathItem.parameters.splice(index, 1)
          parameterFound = true
        }
      }
    }

    if (!parameterFound) {
      throw createToolError(
        `Parameter ${parameterName} in ${parameterIn} not found`,
        'VALIDATION_ERROR',
        params as any
      )
    }

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)

    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'parameter_deleted',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: {
        path,
        method: method || 'path-level',
        parameterName,
        parameterIn,
      },
    })

    return this.success(`Deleted parameter ${parameterName}`, {
      path,
      method: method || 'path-level',
      parameterName,
      parameterIn,
    })
  }

  /**
   * Describe the tool for MCP registration
   */
  describe() {
    return {
      name: 'parameters_configure',
      description:
        'Configure parameters in OpenAPI specs: list, add, update, and delete parameters at path or operation level. Manage query params, path params, headers, and cookies with precision.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string', description: 'API identifier (kebab-case)' },
          version: { type: 'string', description: 'Version tag (format: v{major}.{minor}.{patch})' },
          operation: {
            type: 'string',
            enum: ['list', 'add', 'update', 'delete'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'Path (e.g., /users/{id})' },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
            description: 'HTTP method (optional, for operation-level parameters)',
          },
          parameter: {
            type: 'object',
            description: 'Parameter definition (for add operation)',
          },
          parameterName: {
            type: 'string',
            description: 'Parameter name (for update/delete)',
          },
          parameterIn: {
            type: 'string',
            enum: ['query', 'header', 'path', 'cookie'],
            description: 'Parameter location (for update/delete)',
          },
          updates: {
            type: 'object',
            description: 'Updates to apply (for update operation)',
          },
          llmReason: {
            type: 'string',
            description: 'Optional: Why the LLM is performing this operation',
          },
        },
        required: ['apiId', 'version', 'operation', 'path'],
      },
    }
  }
}

