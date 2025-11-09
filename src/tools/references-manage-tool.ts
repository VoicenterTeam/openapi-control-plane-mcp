/**
 * References Manage Tool
 *
 * @description Manages $ref references in OpenAPI specs. Finding references is like
 * detective work - follow the clues, find the connections, solve the mystery.
 */

import { BaseTool } from '../types/mcp-tool'
import type { ToolResult } from '../types/mcp-tool'
import type { ApiId, VersionTag } from '../types/openapi'
import type { SpecManager } from '../services/spec-manager'
import type { AuditLogger } from '../services/audit-logger'
import { createToolError } from '../utils/errors'
import { referencesManageSchema, type ReferencesManageParams } from './schemas/references-manage-schema'

export class ReferencesManageTool extends BaseTool {
  constructor(private specManager: SpecManager, private auditLogger: AuditLogger) {
    super()
  }

  async execute(params: ReferencesManageParams): Promise<ToolResult> {
    this.validate(params, referencesManageSchema)

    try {
      switch (params.operation) {
        case 'find':
          return await this.handleFind(params)
        case 'validate':
          return await this.handleValidate(params)
        case 'update':
          return await this.handleUpdate(params)
        default:
          throw createToolError('Unknown operation', 'VALIDATION_ERROR', params as any)
      }
    } catch (error) {
      throw createToolError(
        `References manage failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, operation: params.operation }
      )
    }
  }

  private async handleFind(params: ReferencesManageParams): Promise<ToolResult> {
    if (params.operation !== 'find') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, componentName, componentType } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    const targetRef = `#/components/${componentType}/${componentName}`
    const usages: any[] = []

    // Search recursively for the reference
    const searchObject = (obj: any, path: string) => {
      if (!obj || typeof obj !== 'object') return

      if (obj.$ref === targetRef) {
        usages.push({ path, ref: obj.$ref })
      }

      for (const key in obj) {
        searchObject(obj[key], `${path}.${key}`)
      }
    }

    searchObject(spec, 'spec')

    return this.success(`Found ${usages.length} usages of ${componentName}`, {
      componentName,
      componentType,
      ref: targetRef,
      usageCount: usages.length,
      usages,
    })
  }

  private async handleValidate(params: ReferencesManageParams): Promise<ToolResult> {
    const { apiId, version } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    const brokenRefs: any[] = []
    const validRefs: any[] = []

    // Find all $ref and check if they exist
    const checkRef = (obj: any, path: string) => {
      if (!obj || typeof obj !== 'object') return

      if (obj.$ref && typeof obj.$ref === 'string') {
        if (obj.$ref.startsWith('#/')) {
          const refPath = obj.$ref.substring(2).split('/')
          let target: any = spec

          for (const part of refPath) {
            target = target?.[part]
          }

          if (target) {
            validRefs.push({ path, ref: obj.$ref })
          } else {
            brokenRefs.push({ path, ref: obj.$ref })
          }
        }
      }

      for (const key in obj) {
        checkRef(obj[key], `${path}.${key}`)
      }
    }

    checkRef(spec, 'spec')

    return this.success(`Validated ${validRefs.length + brokenRefs.length} references`, {
      totalRefs: validRefs.length + brokenRefs.length,
      validRefs: validRefs.length,
      brokenRefs: brokenRefs.length,
      broken: brokenRefs,
    })
  }

  private async handleUpdate(params: ReferencesManageParams): Promise<ToolResult> {
    if (params.operation !== 'update') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, oldRef, newRef, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    let updateCount = 0

    const updateRefs = (obj: any) => {
      if (!obj || typeof obj !== 'object') return

      if (obj.$ref === oldRef) {
        obj.$ref = newRef
        updateCount++
      }

      for (const key in obj) {
        updateRefs(obj[key])
      }
    }

    updateRefs(spec)

    if (updateCount === 0) {
      throw createToolError(`Reference ${oldRef} not found`, 'VALIDATION_ERROR', params as any)
    }

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'references_updated',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { oldRef, newRef, updateCount },
    })

    return this.success(`Updated ${updateCount} references`, { oldRef, newRef, updateCount })
  }

  describe() {
    return {
      name: 'references_manage',
      description: 'Manage $ref references: find usages of components, validate all references, and update reference paths across the spec.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string' },
          version: { type: 'string' },
          operation: { type: 'string', enum: ['find', 'validate', 'update'] },
          componentName: { type: 'string' },
          componentType: { type: 'string', enum: ['schemas', 'responses', 'parameters', 'examples', 'requestBodies', 'headers'] },
          oldRef: { type: 'string' },
          newRef: { type: 'string' },
          llmReason: { type: 'string' },
        },
        required: ['apiId', 'version', 'operation'],
      },
    }
  }
}

