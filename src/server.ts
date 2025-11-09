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

  // Suppress unused variable warnings - tools are instantiated but not used in this server
  // They are used in mcp-server.ts instead
  void specReadTool
  void specValidateTool
  void metadataUpdateTool
  void schemaManageTool
  void endpointManageTool
  void versionControlTool
  void parametersConfigureTool
  void responsesConfigureTool
  void securityConfigureTool
  void referencesManageTool

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }
  })

  // MCP endpoint (for future HTTP transport)
  fastify.post('/mcp', async () => {
    // Future: Handle MCP over HTTP
    // For now, return a placeholder
    return {
      message: 'MCP server running - use npm run start:mcp for stdio connection',
      tools: [
        'spec_read',
        'spec_validate',
        'metadata_update',
        'schema_manage',
        'endpoint_manage',
        'version_control',
        'parameters_configure',
        'responses_configure',
        'security_configure',
        'references_manage',
      ],
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

