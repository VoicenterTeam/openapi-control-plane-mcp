/**
 * MCP Server
 *
 * @description Main server file that initializes Fastify and MCP, and registers tools.
 * The grand central station of our MCP server - where everything comes together.
 * All aboard! 🚂
 *
 * @module server
 */

import Fastify from 'fastify'
import { config } from './config/index.js'
import { FileSystemStorage } from './storage/file-system-storage.js'
import { SpecManager } from './services/spec-manager.js'
import { VersionManager } from './services/version-manager.js'
import { DiffCalculator } from './services/diff-calculator.js'
import { ValidationService } from './services/validation-service.js'
import { AuditLogger } from './services/audit-logger.js'
import {
  SpecReadTool,
  SpecValidateTool,
  MetadataUpdateTool,
  SchemaManageTool,
  EndpointManageTool,
  VersionControlTool,
  ParametersConfigureTool,
  ResponsesConfigureTool,
  SecurityConfigureTool,
  ReferencesManageTool,
} from './tools/index.js'
import { logger } from './utils/logger.js'

/**
 * Builds and configures the Fastify server
 * @returns Configured Fastify instance
 * @description Sets up the entire server stack. Like assembling IKEA furniture,
 * but with better documentation and fewer leftover screws.
 */
export async function buildServer() {
  // Initialize Fastify
  const fastify = Fastify({
    logger: false, // We use our own Pino logger
    trustProxy: true,
  })

  // Initialize storage
  const storage = new FileSystemStorage({
    basePath: config.DATA_DIR,
  })

  // Initialize services
  const specManager = new SpecManager(storage)
  const versionManager = new VersionManager(storage)
  const diffCalculator = new DiffCalculator()
  const validationService = new ValidationService(specManager)
  const auditLogger = new AuditLogger(storage)

  // Register tools
  const specReadTool = new SpecReadTool(specManager)
  const specValidateTool = new SpecValidateTool(validationService)
  const metadataUpdateTool = new MetadataUpdateTool(specManager, auditLogger)
  const schemaManageTool = new SchemaManageTool(specManager, auditLogger)
  const endpointManageTool = new EndpointManageTool(specManager, auditLogger)
  const versionControlTool = new VersionControlTool(
    specManager,
    versionManager,
    diffCalculator,
    auditLogger
  )
  const parametersConfigureTool = new ParametersConfigureTool(specManager, auditLogger)
  const responsesConfigureTool = new ResponsesConfigureTool(specManager, auditLogger)
  const securityConfigureTool = new SecurityConfigureTool(specManager, auditLogger)
  const referencesManageTool = new ReferencesManageTool(specManager, auditLogger)

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tools: 10,
    }
  })

  // List all available tools
  fastify.get('/tools', async () => {
    const tools = [
      specReadTool,
      specValidateTool,
      metadataUpdateTool,
      schemaManageTool,
      endpointManageTool,
      versionControlTool,
      parametersConfigureTool,
      responsesConfigureTool,
      securityConfigureTool,
      referencesManageTool,
    ]

    return {
      tools: tools.map((tool) => {
        const desc = tool.describe()
        return {
          name: desc.name,
          description: desc.description,
          inputSchema: desc.inputSchema,
        }
      }),
    }
  })

  // Execute a tool via HTTP POST
  fastify.post('/tools/:toolName', async (request, reply) => {
    const { toolName } = request.params as { toolName: string }
    const args = request.body as any

    logger.info({ tool: toolName, args }, 'Tool called via HTTP')

    try {
      let result

      switch (toolName) {
        case 'spec_read':
          result = await specReadTool.execute(args)
          break
        case 'spec_validate':
          result = await specValidateTool.execute(args)
          break
        case 'metadata_update':
          result = await metadataUpdateTool.execute(args)
          break
        case 'schema_manage':
          result = await schemaManageTool.execute(args)
          break
        case 'endpoint_manage':
          result = await endpointManageTool.execute(args)
          break
        case 'version_control':
          result = await versionControlTool.execute(args)
          break
        case 'parameters_configure':
          result = await parametersConfigureTool.execute(args)
          break
        case 'responses_configure':
          result = await responsesConfigureTool.execute(args)
          break
        case 'security_configure':
          result = await securityConfigureTool.execute(args)
          break
        case 'references_manage':
          result = await referencesManageTool.execute(args)
          break
        default:
          reply.code(404)
          return { error: `Unknown tool: ${toolName}` }
      }

      return result
    } catch (error) {
      reply.code(500)
      return {
        error: (error as Error).message,
        stack: config.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }
    }
  })

  // MCP SSE endpoint - GET for connection
  fastify.get('/mcp/sse', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Send initial connection message
    reply.raw.write('event: endpoint\n')
    reply.raw.write(`data: ${JSON.stringify({ type: 'endpoint', endpoint: '/mcp/message' })}\n\n`)

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n')
    }, 30000)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      logger.info('SSE client disconnected')
    })
  })

  // MCP SSE endpoint - POST for protocol messages (Cursor sends all requests here)
  fastify.post('/mcp/sse', async (request) => {
    const body = request.body as any
    const { method, id } = body
    logger.info({ body }, 'MCP SSE POST request received')
    
    try {
      // Handle initialize
      if (method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'openapi-control-panel-mcp',
              version: '1.0.1',
            },
            capabilities: {
              tools: {},
            },
          },
        }
        logger.info({ response }, 'Sending initialize response')
        return response
      }
      
      // Handle notifications/initialized (no response needed, but return empty success)
      if (method === 'notifications/initialized') {
        logger.info('Client initialized notification received')
        return { jsonrpc: '2.0' }
      }
      
      // Handle tools/list
      if (method === 'tools/list') {
        const tools = [
          specReadTool,
          specValidateTool,
          metadataUpdateTool,
          schemaManageTool,
          endpointManageTool,
          versionControlTool,
          parametersConfigureTool,
          responsesConfigureTool,
          securityConfigureTool,
          referencesManageTool,
        ]
        
        // Helper to flatten JSON Schema (resolve $ref to inline schema)
        const flattenSchema = (schema: any) => {
          if (schema.$ref && schema.definitions) {
            // Extract the definition name from $ref (e.g., "#/definitions/specReadSchema")
            const refName = schema.$ref.split('/').pop()
            if (refName && schema.definitions[refName]) {
              // Return the resolved schema without $ref
              return schema.definitions[refName]
            }
          }
          return schema
        }
        
        const toolsList = tools.map((tool) => {
          const desc = tool.describe()
          return {
            name: desc.name,
            description: desc.description,
            inputSchema: flattenSchema(desc.inputSchema),
          }
        })
        
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: toolsList,
          },
        }
        
        logger.info({ 
          toolCount: tools.length,
          toolNames: toolsList.map(t => t.name),
          fullResponse: JSON.stringify(response, null, 2)
        }, 'Sending tools list response')
        
        return response
      }
      
      // Handle tools/call
      if (method === 'tools/call') {
        const { name, arguments: args } = body.params
        logger.info({ toolName: name, args }, 'Tool call requested')
        
        let toolResult
        
        switch (name) {
          case 'spec_read':
            toolResult = await specReadTool.execute(args)
            break
          case 'spec_validate':
            toolResult = await specValidateTool.execute(args)
            break
          case 'metadata_update':
            toolResult = await metadataUpdateTool.execute(args)
            break
          case 'schema_manage':
            toolResult = await schemaManageTool.execute(args)
            break
          case 'endpoint_manage':
            toolResult = await endpointManageTool.execute(args)
            break
          case 'version_control':
            toolResult = await versionControlTool.execute(args)
            break
          case 'parameters_configure':
            toolResult = await parametersConfigureTool.execute(args)
            break
          case 'responses_configure':
            toolResult = await responsesConfigureTool.execute(args)
            break
          case 'security_configure':
            toolResult = await securityConfigureTool.execute(args)
            break
          case 'references_manage':
            toolResult = await referencesManageTool.execute(args)
            break
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
        
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
          },
        }
      }
      
      // Unknown method
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      }
    } catch (error) {
      logger.error({ error }, 'Error handling MCP request')
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: (error as Error).message,
        },
      }
    }
  })

  // MCP message endpoint for SSE transport
  fastify.post('/mcp/message', async (request) => {
    const body = request.body as any
    const { jsonrpc, method, params, id } = body

    logger.info({ method, params }, 'MCP message received via SSE')

    try {
      let result: any

      if (method === 'tools/list') {
        const tools = [
          specReadTool,
          specValidateTool,
          metadataUpdateTool,
          schemaManageTool,
          endpointManageTool,
          versionControlTool,
          parametersConfigureTool,
          responsesConfigureTool,
          securityConfigureTool,
          referencesManageTool,
        ]

        result = {
          tools: tools.map((tool) => {
            const desc = tool.describe()
            return {
              name: desc.name,
              description: desc.description,
              inputSchema: desc.inputSchema,
            }
          }),
        }
      } else if (method === 'tools/call') {
        const { name, arguments: args } = params

        let toolResult

        switch (name) {
          case 'spec_read':
            toolResult = await specReadTool.execute(args)
            break
          case 'spec_validate':
            toolResult = await specValidateTool.execute(args)
            break
          case 'metadata_update':
            toolResult = await metadataUpdateTool.execute(args)
            break
          case 'schema_manage':
            toolResult = await schemaManageTool.execute(args)
            break
          case 'endpoint_manage':
            toolResult = await endpointManageTool.execute(args)
            break
          case 'version_control':
            toolResult = await versionControlTool.execute(args)
            break
          case 'parameters_configure':
            toolResult = await parametersConfigureTool.execute(args)
            break
          case 'responses_configure':
            toolResult = await responsesConfigureTool.execute(args)
            break
          case 'security_configure':
            toolResult = await securityConfigureTool.execute(args)
            break
          case 'references_manage':
            toolResult = await referencesManageTool.execute(args)
            break
          default:
            throw new Error(`Unknown tool: ${name}`)
        }

        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2),
            },
          ],
        }
      } else {
        throw new Error(`Unsupported method: ${method}`)
      }

      return {
        jsonrpc: jsonrpc || '2.0',
        id,
        result,
      }
    } catch (error) {
      return {
        jsonrpc: jsonrpc || '2.0',
        id,
        error: {
          code: -32603,
          message: (error as Error).message,
        },
      }
    }
  })

  // REST API Routes for UI
  // GET /api/specs - List all API specs with metadata
  fastify.get('/api/specs', async () => {
    try {
      const allItems = await storage.list('/')
      
      // Extract only top-level directory names (API IDs)
      const apiDirs = [...new Set(
        allItems
          .filter((item) => {
            // Exclude hidden files/dirs
            if (item.startsWith('.')) return false
            // Exclude known non-API directories
            const topLevel = item.split(/[/\\]/)[0]
            if (['specs', 'backups'].includes(topLevel)) return false
            return true
          })
          .map((item) => {
            // Extract the top-level directory name
            return item.split(/[/\\]/)[0]
          })
      )]
      
      const specs = await Promise.all(
        apiDirs.map(async (apiId) => {
          try {
            return await versionManager.getApiMetadata(apiId as any)
          } catch (error) {
            logger.warn({ apiId, error }, 'Failed to load API metadata')
            return null
          }
        })
      )
      return specs.filter((spec) => spec !== null)
    } catch (error) {
      logger.error({ error }, 'Failed to list specs')
      throw error
    }
  })

  // GET /api/specs/:apiId - Get specific spec with current version
  fastify.get<{ Params: { apiId: string } }>('/api/specs/:apiId', async (request) => {
    const { apiId } = request.params
    try {
      const metadata = await versionManager.getApiMetadata(apiId as any)
      return metadata
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to get spec')
      throw error
    }
  })

  // GET /api/specs/:apiId/versions - List all versions for an API
  fastify.get<{ Params: { apiId: string } }>('/api/specs/:apiId/versions', async (request) => {
    const { apiId } = request.params
    try {
      const metadata = await versionManager.getApiMetadata(apiId as any)
      const versions = await Promise.all(
        metadata.versions.map(async (version) => {
          try {
            return await versionManager.getVersionMetadata(apiId as any, version)
          } catch (error) {
            logger.warn({ apiId, version, error }, 'Failed to load version metadata')
            return null
          }
        })
      )
      return versions.filter((v) => v !== null)
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to list versions')
      throw error
    }
  })

  // GET /api/specs/:apiId/versions/:version - Get specific version with spec
  fastify.get<{ Params: { apiId: string; version: string } }>(
    '/api/specs/:apiId/versions/:version',
    async (request) => {
      const { apiId, version } = request.params
      try {
        const metadata = await versionManager.getVersionMetadata(apiId as any, version as any)
        const spec = await specManager.loadSpec(apiId as any, version as any)
        return { metadata, spec: spec.spec }
      } catch (error) {
        logger.error({ apiId, version, error }, 'Failed to get version')
        throw error
      }
    }
  )

  // PUT /api/specs/:apiId - Update spec (simple editor support)
  fastify.put<{ Params: { apiId: string }; Body: any }>('/api/specs/:apiId', async (request) => {
    const { apiId } = request.params
    const body = request.body as { spec: any; version: string; description?: string }
    const { spec, version } = body
    try {
      await specManager.saveSpec(apiId as any, version as any, spec)
      logger.info({ apiId, version }, 'Spec updated via API')
      return { success: true, message: 'Spec updated successfully' }
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to update spec')
      throw error
    }
  })

  // GET /api/audit - Get audit log (with optional filters)
  fastify.get<{ Querystring: { apiId?: string; limit?: number } }>('/api/audit', async (request) => {
    const { apiId, limit } = request.query
    try {
      if (apiId) {
        const log = await auditLogger.getAuditLog(apiId as any, limit)
        return log
      } else {
        // Get audit logs for all APIs
        const apis = await storage.list('/')
        const allLogs = await Promise.all(
          apis
            .filter((dir) => !dir.startsWith('.') && !['specs', 'backups'].includes(dir))
            .map(async (api) => {
              try {
                return await auditLogger.getAuditLog(api as any)
              } catch (error) {
                return []
              }
            })
        )
        const combined = allLogs.flat().sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })
        return limit ? combined.slice(0, limit) : combined
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get audit log')
      throw error
    }
  })

  // GET /api/audit/:apiId - Get audit log for specific API
  fastify.get<{ Params: { apiId: string }; Querystring: { limit?: number } }>(
    '/api/audit/:apiId',
    async (request) => {
      const { apiId } = request.params
      const { limit } = request.query
      try {
        const log = await auditLogger.getAuditLog(apiId as any, limit)
        return log
      } catch (error) {
        logger.error({ apiId, error }, 'Failed to get audit log')
        throw error
      }
    }
  )

  // GET /api/stats - Dashboard statistics
  fastify.get('/api/stats', async () => {
    try {
      const apis = await storage.list('/')
      const validApis = apis.filter((dir) => !dir.startsWith('.') && !['specs', 'backups'].includes(dir))

      let totalSpecs = 0
      let totalVersions = 0
      let totalEndpoints = 0
      let totalSchemas = 0
      const specsByTag: Record<string, number> = {}
      let breakingChangesCount = 0

      const allMetadata = await Promise.all(
        validApis.map(async (apiId) => {
          try {
            return await versionManager.getApiMetadata(apiId as any)
          } catch (error) {
            return null
          }
        })
      )

      for (const metadata of allMetadata) {
        if (!metadata) continue
        totalSpecs++
        totalVersions += metadata.versions.length

        // Count tags
        if (metadata.tags) {
          metadata.tags.forEach((tag) => {
            specsByTag[tag] = (specsByTag[tag] || 0) + 1
          })
        }

        // Get stats from current version
        try {
          const versionMeta = await versionManager.getVersionMetadata(
            metadata.api_id,
            metadata.current_version
          )
          totalEndpoints += versionMeta.stats.endpoint_count
          totalSchemas += versionMeta.stats.schema_count
          if (versionMeta.changes.breaking_changes.length > 0) {
            breakingChangesCount++
          }
        } catch (error) {
          // Ignore errors for individual versions
        }
      }

      // Get recent changes from audit log
      const allLogs = await Promise.all(
        validApis.map(async (api) => {
          try {
            return await auditLogger.getAuditLog(api as any, 10)
          } catch (error) {
            return []
          }
        })
      )
      const recentChanges = allLogs
        .flat()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
        .map((log) => ({
          timestamp: log.timestamp,
          api_id: log.api_id,
          event: log.event,
          version: log.version,
        }))

      // Calculate versions this week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const versionsThisWeek = recentChanges.filter(
        (change) => change.event === 'version_created' && new Date(change.timestamp) >= oneWeekAgo
      ).length

      return {
        total_specs: totalSpecs,
        total_versions: totalVersions,
        total_endpoints: totalEndpoints,
        total_schemas: totalSchemas,
        recent_changes: recentChanges,
        specs_by_tag: specsByTag,
        breaking_changes_count: breakingChangesCount,
        versions_this_week: versionsThisWeek,
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get dashboard stats')
      throw error
    }
  })

  return fastify
}

/**
 * Starts the server
 * @description Main entry point. Starts the server and begins listening for requests.
 * The moment of truth! 🎬
 */
async function start() {
  try {
    console.log('Starting server...')
    const server = await buildServer()
    console.log('Server built successfully')

    await server.listen({
      port: config.PORT,
      host: config.HOST,
    })

    console.log(`🚀 Server listening on http://${config.HOST}:${config.PORT}`)
    
    logger.info(
      {
        port: config.PORT,
        host: config.HOST,
        env: config.NODE_ENV,
      },
      `🚀 OpenAPI Control Panel MCP Server started!`
    )

    // Ensure data directories exist
    const { FileSystemStorage } = await import('./storage/file-system-storage.js')
    const storage = new FileSystemStorage({ basePath: config.DATA_DIR })
    await storage.ensureDirectory('specs')
    await storage.ensureDirectory('backups')

    logger.info('Data directories initialized')
  } catch (error) {
    console.error('❌ ERROR starting server:', error)
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ UNHANDLED REJECTION:', error)
  process.exit(1)
})

// Start server if run directly
console.log('Module loaded, starting server...')
start().catch(error => {
  console.error('❌ FATAL ERROR during startup:', error)
  logger.error({ error }, 'Fatal error during startup')
  process.exit(1)
})

