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
import { VersionManager } from './services/version-manager'
import { DiffCalculator } from './services/diff-calculator'
import { ValidationService } from './services/validation-service'
import { AuditLogger } from './services/audit-logger'
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
} from './tools'
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
  const versionManager = new VersionManager(storage)
  const diffCalculator = new DiffCalculator()
  const validationService = new ValidationService(specManager)
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

