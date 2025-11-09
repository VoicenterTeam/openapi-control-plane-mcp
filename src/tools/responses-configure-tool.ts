/**
 * Responses Configure Tool
 *
 * @description Manages API responses. Because every endpoint needs to know
 * how to say "yes", "no", and "I have no idea what you want".
 */

import { BaseTool } from '../types/mcp-tool'
import type { ToolResult } from '../types/mcp-tool'
import type { ApiId, VersionTag } from '../types/openapi'
import type { SpecManager } from '../services/spec-manager'
import type { AuditLogger } from '../services/audit-logger'
import { createToolError } from '../utils/errors'
import {
  responsesConfigureSchema,
  type ResponsesConfigureParams,
} from './schemas/responses-configure-schema'

export class ResponsesConfigureTool extends BaseTool {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }

  async execute(params: ResponsesConfigureParams): Promise<ToolResult> {
    this.validate(params, responsesConfigureSchema)

    try {
      switch (params.operation) {
        case 'list':
          return await this.handleList(params)
        case 'add':
          return await this.handleAdd(params)
        case 'update':
          return await this.handleUpdate(params)
        case 'delete':
          return await this.handleDelete(params)
        default:
          throw createToolError('Unknown operation', 'VALIDATION_ERROR', params as any)
      }
    } catch (error) {
      throw createToolError(
        `Responses configure failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, operation: params.operation }
      )
    }
  }

  private async handleList(params: ResponsesConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'list') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths?.[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const normalizedMethod = (method as string).toLowerCase()
    const operation = spec.paths[path as string][normalizedMethod]

    if (!operation) {
      throw createToolError(`Method ${method} not found`, 'VALIDATION_ERROR', params as any)
    }

    const responses = operation.responses || {}
    const responseList = Object.keys(responses).map(code => ({
      statusCode: code,
      ...responses[code],
    }))

    return this.success(`Found ${responseList.length} responses`, {
      path,
      method,
      count: responseList.length,
      responses: responseList,
    })
  }

  private async handleAdd(params: ResponsesConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'add') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, statusCode, response, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths?.[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const normalizedMethod = (method as string).toLowerCase()
    const operation = spec.paths[path as string][normalizedMethod]

    if (!operation) {
      throw createToolError(`Method ${method} not found`, 'VALIDATION_ERROR', params as any)
    }

    if (!operation.responses) {
      operation.responses = {}
    }

    if (operation.responses[statusCode as string]) {
      throw createToolError(`Response ${statusCode} already exists`, 'VALIDATION_ERROR', params as any)
    }

    operation.responses[statusCode as string] = response

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'response_added',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { path, method, statusCode },
    })

    return this.success(`Added response ${statusCode}`, { path, method, statusCode, response })
  }

  private async handleUpdate(params: ResponsesConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'update') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, statusCode, updates, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths?.[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const normalizedMethod = (method as string).toLowerCase()
    const operation = spec.paths[path as string][normalizedMethod]

    if (!operation?.responses?.[statusCode as string]) {
      throw createToolError(`Response ${statusCode} not found`, 'VALIDATION_ERROR', params as any)
    }

    Object.assign(operation.responses[statusCode as string], updates)

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'response_updated',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { path, method, statusCode, updates },
    })

    return this.success(`Updated response ${statusCode}`, { path, method, statusCode, updates })
  }

  private async handleDelete(params: ResponsesConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'delete') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, path, method, statusCode, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.paths?.[path as string]) {
      throw createToolError(`Path ${path} not found`, 'VALIDATION_ERROR', params as any)
    }

    const normalizedMethod = (method as string).toLowerCase()
    const operation = spec.paths[path as string][normalizedMethod]

    if (!operation?.responses?.[statusCode as string]) {
      throw createToolError(`Response ${statusCode} not found`, 'VALIDATION_ERROR', params as any)
    }

    delete operation.responses[statusCode as string]

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'response_deleted',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { path, method, statusCode },
    })

    return this.success(`Deleted response ${statusCode}`, { path, method, statusCode })
  }

  describe() {
    return {
      name: 'responses_configure',
      description:
        'Configure API responses: list, add, update, and delete response definitions for operations. Manage status codes, descriptions, content types, and headers.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string' },
          version: { type: 'string' },
          operation: { type: 'string', enum: ['list', 'add', 'update', 'delete'] },
          path: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
          statusCode: { type: 'string' },
          response: { type: 'object' },
          updates: { type: 'object' },
          llmReason: { type: 'string' },
        },
        required: ['apiId', 'version', 'operation', 'path', 'method'],
      },
    }
  }
}

