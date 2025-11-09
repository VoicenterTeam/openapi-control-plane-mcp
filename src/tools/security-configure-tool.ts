/**
 * Security Configure Tool
 *
 * @description Manages API security schemes and requirements. Because APIs without
 * security are like houses without locks - technically functional, but not advisable.
 */

import { BaseTool } from '../types/mcp-tool'
import type { ToolResult } from '../types/mcp-tool'
import type { ApiId, VersionTag } from '../types/openapi'
import type { SpecManager } from '../services/spec-manager'
import type { AuditLogger } from '../services/audit-logger'
import { createToolError } from '../utils/errors'
import { securityConfigureSchema, type SecurityConfigureParams } from './schemas/security-configure-schema'

export class SecurityConfigureTool extends BaseTool {
  constructor(private specManager: SpecManager, private auditLogger: AuditLogger) {
    super()
  }

  async execute(params: SecurityConfigureParams): Promise<ToolResult> {
    this.validate(params, securityConfigureSchema)

    try {
      switch (params.operation) {
        case 'list_schemes':
          return await this.handleListSchemes(params)
        case 'add_scheme':
          return await this.handleAddScheme(params)
        case 'delete_scheme':
          return await this.handleDeleteScheme(params)
        case 'set_global':
          return await this.handleSetGlobal(params)
        default:
          throw createToolError('Unknown operation', 'VALIDATION_ERROR', params as any)
      }
    } catch (error) {
      throw createToolError(
        `Security configure failed: ${(error as Error).message}`,
        'TOOL_ERROR',
        { apiId: params.apiId, operation: params.operation }
      )
    }
  }

  private async handleListSchemes(params: SecurityConfigureParams): Promise<ToolResult> {
    const { apiId, version } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    const schemes = spec.components?.securitySchemes || {}
    const schemeList = Object.keys(schemes).map(name => ({ name, ...schemes[name] }))

    return this.success(`Found ${schemeList.length} security schemes`, {
      count: schemeList.length,
      schemes: schemeList,
      globalSecurity: spec.security || [],
    })
  }

  private async handleAddScheme(params: SecurityConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'add_scheme') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, schemeName, scheme, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.components) spec.components = {}
    if (!spec.components.securitySchemes) spec.components.securitySchemes = {}

    if (spec.components.securitySchemes[schemeName]) {
      throw createToolError(`Security scheme ${schemeName} already exists`, 'VALIDATION_ERROR', params as any)
    }

    spec.components.securitySchemes[schemeName] = scheme

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'security_scheme_added',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { schemeName },
    })

    return this.success(`Added security scheme ${schemeName}`, { schemeName, scheme })
  }

  private async handleDeleteScheme(params: SecurityConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'delete_scheme') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, schemeName, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    if (!spec.components?.securitySchemes?.[schemeName]) {
      throw createToolError(`Security scheme ${schemeName} not found`, 'VALIDATION_ERROR', params as any)
    }

    delete spec.components.securitySchemes[schemeName]

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'security_scheme_deleted',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { schemeName },
    })

    return this.success(`Deleted security scheme ${schemeName}`, { schemeName })
  }

  private async handleSetGlobal(params: SecurityConfigureParams): Promise<ToolResult> {
    if (params.operation !== 'set_global') {
      throw createToolError('Invalid operation', 'VALIDATION_ERROR', params as any)
    }

    const { apiId, version, security, llmReason } = params
    const doc = await this.specManager.loadSpec(apiId as ApiId, version as VersionTag)
    const spec = (doc as any).spec

    spec.security = security

    await this.specManager.saveSpec(apiId as ApiId, version as VersionTag, spec)
    await this.auditLogger.logEvent({
      api_id: apiId as ApiId,
      version: version as VersionTag,
      event: 'global_security_updated',
      user: 'mcp-tool',
      timestamp: new Date().toISOString(),
      llm_reason: llmReason as string | undefined,
      details: { security },
    })

    return this.success('Updated global security', { security })
  }

  describe() {
    return {
      name: 'security_configure',
      description: 'Configure API security: manage security schemes (API keys, OAuth, JWT) and set global security requirements.',
      inputSchema: {
        type: 'object',
        properties: {
          apiId: { type: 'string' },
          version: { type: 'string' },
          operation: { type: 'string', enum: ['list_schemes', 'add_scheme', 'delete_scheme', 'set_global'] },
          schemeName: { type: 'string' },
          scheme: { type: 'object' },
          security: { type: 'array' },
          llmReason: { type: 'string' },
        },
        required: ['apiId', 'version', 'operation'],
      },
    }
  }
}

