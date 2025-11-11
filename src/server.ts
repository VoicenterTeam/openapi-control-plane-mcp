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
              name: 'openapi-control-plane-mcp',
              version: '1.0.0',
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
        
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: tools.map((tool) => {
              const desc = tool.describe()
              return {
                name: desc.name,
                description: desc.description,
                inputSchema: desc.inputSchema,
              }
            }),
          },
        }
        logger.info({ toolCount: tools.length }, 'Sending tools list')
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
      `🚀 OpenAPI Control Plane MCP Server started!`
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

