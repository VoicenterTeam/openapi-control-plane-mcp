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
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { config } from './config'
import { FileSystemStorage } from './storage/file-system-storage'
import { SpecManager } from './services/spec-manager'
import { AuditLogger } from './services/audit-logger'
import { SpecReadTool, MetadataUpdateTool } from './tools'
import { logger } from './utils/logger'

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
  const auditLogger = new AuditLogger(storage)

  // Initialize MCP server
  const mcp = new McpServer(
    {
      name: 'openapi-control-plane-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // Register tools
  const specReadTool = new SpecReadTool(specManager)
  const metadataUpdateTool = new MetadataUpdateTool(specManager, auditLogger)
  
  const specReadDesc = specReadTool.describe()
  const metadataUpdateDesc = metadataUpdateTool.describe()

  mcp.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: specReadDesc.name,
          description: specReadDesc.description,
          inputSchema: specReadDesc.inputSchema,
        },
        {
          name: metadataUpdateDesc.name,
          description: metadataUpdateDesc.description,
          inputSchema: metadataUpdateDesc.inputSchema,
        },
      ],
    }
  })

  mcp.setRequestHandler('tools/call', async request => {
    const { name, arguments: args } = request.params

    logger.info({ tool: name, args }, 'Tool called via MCP')

    if (name === 'spec_read') {
      const result = await specReadTool.execute(args as any)
      return result
    }

    if (name === 'metadata_update') {
      const result = await metadataUpdateTool.execute(args as any)
      return result
    }

    throw new Error(`Unknown tool: ${name}`)
  })

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }
  })

  // MCP endpoint (for future HTTP transport)
  fastify.post('/mcp', async (request, reply) => {
    // Future: Handle MCP over HTTP
    // For now, return a placeholder
    return {
      message: 'MCP server running - use MCP SDK for communication',
      tools: ['spec_read', 'metadata_update'],
    }
  })

  // Connect MCP server transport (stdio by default)
  const transport = {
    start: async () => {
      logger.info('MCP transport started (stdio)')
    },
    close: async () => {
      logger.info('MCP transport closed')
    },
  }

  await mcp.connect(transport as any)

  return fastify
}

/**
 * Starts the server
 * @description Main entry point. Starts the server and begins listening for requests.
 * The moment of truth! 🎬
 */
async function start() {
  try {
    const server = await buildServer()

    await server.listen({
      port: config.PORT,
      host: config.HOST,
    })

    logger.info(
      {
        port: config.PORT,
        host: config.HOST,
        env: config.NODE_ENV,
      },
      `🚀 OpenAPI Control Plane MCP Server started!`
    )

    // Ensure data directories exist
    const { FileSystemStorage } = await import('./storage/file-system-storage')
    const storage = new FileSystemStorage({ basePath: config.DATA_DIR })
    await storage.ensureDirectory('specs')
    await storage.ensureDirectory('backups')

    logger.info('Data directories initialized')
  } catch (error) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(error => {
    logger.error({ error }, 'Fatal error during startup')
    process.exit(1)
  })
}

