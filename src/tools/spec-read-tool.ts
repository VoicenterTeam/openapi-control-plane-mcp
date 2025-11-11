/**
 * Spec Read Tool
 *
 * @description MCP tool for reading and querying OpenAPI specifications.
 * The first tool! Like the first pancake - might not be perfect, but it
 * proves the griddle works. 🥞
 *
 * @module tools/spec-read-tool
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { BaseTool, type BaseToolParams, type ToolResult, type ToolDescription } from '../types/mcp-tool.js'
import { SpecManager } from '../services/spec-manager.js'
import { validateApiId, validateVersionTag } from '../utils/validation.js'
import { createApiId, createVersionTag } from '../types/openapi.js'
import { createToolError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Parameters for spec_read tool
 */
interface SpecReadParams extends BaseToolParams {
  apiId: string
  version: string
  queryType: 'full_spec' | 'endpoints_list' | 'endpoint_detail' | 'schema_detail' | 'info' | 'servers'
  path?: string
  method?: string
  schemaName?: string
  filters?: {
    tags?: string[]
    deprecated?: boolean
  }
}

/**
 * Schema for spec_read parameters
 */
const specReadSchema = z.object({
  apiId: z.string().describe('API identifier'),
  version: z.string().describe('Version tag (e.g., v1.0.0)'),
  queryType: z.enum(['full_spec', 'endpoints_list', 'endpoint_detail', 'schema_detail', 'info', 'servers']).describe('Type of information to retrieve'),
  path: z.string().optional().describe('Specific endpoint path (required for endpoint_detail)'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional().describe('HTTP method'),
  schemaName: z.string().optional().describe('Schema name (required for schema_detail)'),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    deprecated: z.boolean().optional(),
  }).optional(),
  llmReason: z.string().optional().describe('Optional reason from LLM for this query'),
})

/**
 * Spec Read Tool
 * @description Reads and queries OpenAPI specifications. The gateway to your API docs.
 * Ask it nicely and it'll tell you everything about your APIs. Ask it rudely and it'll...
 * still tell you everything, but it'll judge you silently.
 */
export class SpecReadTool extends BaseTool<SpecReadParams> {
  constructor(private specManager: SpecManager) {
    super()
  }

  /**
   * Executes the spec_read tool
   * @param params - Tool parameters
   * @returns Tool result with requested information
   */
  async execute(params: SpecReadParams): Promise<ToolResult> {
    try {
      // Validate parameters
      const validated = this.validate(params, specReadSchema)
      const apiId = createApiId(validateApiId(validated.apiId))
      const version = createVersionTag(validateVersionTag(validated.version))

      logger.info(
        { apiId, version, queryType: validated.queryType, llmReason: validated.llmReason },
        'Executing spec_read tool'
      )

      // Load the spec
      const { spec } = await this.specManager.loadSpec(apiId, version)

      // Route to appropriate handler
      switch (validated.queryType) {
        case 'full_spec':
          return this.handleFullSpec(spec)
        case 'endpoints_list':
          return this.handleEndpointsList(spec, validated.method, validated.filters)
        case 'endpoint_detail':
          return this.handleEndpointDetail(spec, validated.path!, validated.method)
        case 'schema_detail':
          return this.handleSchemaDetail(spec, validated.schemaName!)
        case 'info':
          return this.handleInfo(spec)
        case 'servers':
          return this.handleServers(spec)
        default:
          return this.error(`Unknown query type: ${validated.queryType}`)
      }
    } catch (error) {
      logger.error({ error, params }, 'spec_read tool failed')
      throw createToolError(
        (error as Error).message,
        'spec_read',
        params as any,
        error as Error
      )
    }
  }

  /**
   * Returns the full spec
   */
  private handleFullSpec(spec: any): ToolResult {
    return this.success('Full OpenAPI specification retrieved', { spec })
  }

  /**
   * Returns list of all endpoints
   */
  private handleEndpointsList(spec: any, method?: string, filters?: SpecReadParams['filters']): ToolResult {
    const paths = spec.paths || {}
    let endpoints: Array<{ path: string; methods: string[] }> = []

    Object.keys(paths).forEach(path => {
      let methods = Object.keys(paths[path]).filter(m => 
        ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(m.toLowerCase())
      )
      
      // Filter by method if provided
      if (method) {
        methods = methods.filter(m => m.toUpperCase() === method.toUpperCase())
      }
      
      // Apply filters if provided
      if (filters) {
        methods.forEach(m => {
          const operation = paths[path][m]
          let include = true

          if (filters.tags && operation.tags) {
            include = filters.tags.some(tag => operation.tags.includes(tag))
          }

          if (filters.deprecated !== undefined) {
            include = include && (operation.deprecated === filters.deprecated)
          }

          if (include) {
            const existing = endpoints.find(e => e.path === path)
            if (existing) {
              existing.methods.push(m.toUpperCase())
            } else {
              endpoints.push({ path, methods: [m.toUpperCase()] })
            }
          }
        })
      } else {
        if (methods.length > 0) {
          endpoints.push({ path, methods: methods.map(m => m.toUpperCase()) })
        }
      }
    })

    return this.success(`Found ${endpoints.length} endpoints`, { endpoints })
  }

  /**
   * Returns details for a specific endpoint
   */
  private handleEndpointDetail(spec: any, path: string, method?: string): ToolResult {
    if (!path) {
      throw createToolError('path parameter is required for endpoint_detail', 'spec_read', { queryType: 'endpoint_detail' })
    }

    const pathItem = spec.paths?.[path]
    if (!pathItem) {
      throw createToolError(`Endpoint not found: ${path}`, 'spec_read', { path })
    }

    if (method) {
      const operation = pathItem[method.toLowerCase()]
      if (!operation) {
        throw createToolError(`Method ${method} not found for path: ${path}`, 'spec_read', { path, method })
      }
      return this.success(`Endpoint detail: ${method} ${path}`, { path, method, operation })
    }

    // Return all methods if no specific method requested
    return this.success(`All methods for path: ${path}`, { path, methods: pathItem })
  }

  /**
   * Returns details for a specific schema
   */
  private handleSchemaDetail(spec: any, schemaName: string): ToolResult {
    if (!schemaName) {
      throw createToolError('schemaName parameter is required for schema_detail', 'spec_read', { queryType: 'schema_detail' })
    }

    const schema = spec.components?.schemas?.[schemaName] || spec.definitions?.[schemaName]
    
    if (!schema) {
      throw createToolError(`Schema not found: ${schemaName}`, 'spec_read', { schemaName })
    }

    return this.success(`Schema detail: ${schemaName}`, { schemaName, schema })
  }

  /**
   * Returns API info
   */
  private handleInfo(spec: any): ToolResult {
    return this.success('API Information', { info: spec.info || {} })
  }

  /**
   * Returns server list
   */
  private handleServers(spec: any): ToolResult {
    const servers = spec.servers || []
    return this.success(`Found ${servers.length} servers`, { servers })
  }

  /**
   * Returns tool description for MCP registration
   */
  describe(): ToolDescription {
    return {
      name: 'spec_read',
      description: 'Read and query OpenAPI specifications. Supports various query types including full spec, endpoints list, endpoint details, schema details, info, and servers.',
      inputSchema: zodToJsonSchema(specReadSchema, 'specReadSchema'),
    }
  }
}

