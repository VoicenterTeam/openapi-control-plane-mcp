#!/usr/bin/env node

/**
 * MCP Server CLI Entry Point
 *
 * @description Simple stdio-based MCP server for connecting to Cursor IDE.
 * Run this to start the server!
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
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

// Initialize services
const storage = new FileSystemStorage({ basePath: config.DATA_DIR })
const specManager = new SpecManager(storage)
const versionManager = new VersionManager(storage)
const diffCalculator = new DiffCalculator()
const validationService = new ValidationService(specManager)
const auditLogger = new AuditLogger(storage)

// Initialize tools
const tools = [
  new SpecReadTool(specManager),
  new SpecValidateTool(validationService),
  new MetadataUpdateTool(specManager, auditLogger),
  new SchemaManageTool(specManager, auditLogger),
  new EndpointManageTool(specManager, auditLogger),
  new VersionControlTool(specManager, versionManager, diffCalculator, auditLogger),
  new ParametersConfigureTool(specManager, auditLogger),
  new ResponsesConfigureTool(specManager, auditLogger),
  new SecurityConfigureTool(specManager, auditLogger),
  new ReferencesManageTool(specManager, auditLogger),
]

// Create MCP server
const server = new Server(
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

// Register all tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
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

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params
  
  const tool = tools.find((t) => t.describe().name === name)
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`)
  }
  
  const result = await tool.execute(args as any)
  
  return {
    content: [
      {
        type: 'text',
        text: `${result.success ? '✅' : '❌'} ${JSON.stringify(result)}`,
      },
    ],
  }
})

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('OpenAPI Control Plane MCP Server running on stdio')
}

main().catch(console.error)

