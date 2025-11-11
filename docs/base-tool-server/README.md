# BaseTool Pattern & MCP Server

## BaseTool Abstract Class

All MCP tools extend the `BaseTool` abstract class, ensuring consistent interface and behavior.

### Interface

```typescript
abstract class BaseTool<T extends BaseToolParams> {
  // Must be implemented by each tool
  abstract execute(params: T): Promise<ToolResult>
  abstract describe(): ToolDescription
  
  // Provided by base class
  validate<T>(params: unknown, schema: z.ZodSchema<T>): T
  success(message: string, data?: unknown): ToolResult
  error(message: string, details?: unknown): ToolResult
}
```

### BaseToolParams

All tool parameters must extend:

```typescript
interface BaseToolParams {
  llmReason?: string  // Optional LLM reasoning
}
```

### Tool Result

Standardized return type:

```typescript
interface ToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError: boolean
  success: boolean
  data?: unknown
}
```

## Implementing a New Tool

### 1. Define Parameters

```typescript
interface MyToolParams extends BaseToolParams {
  apiId: string
  version: string
  operation: 'list' | 'add' | 'delete'
  // ... operation-specific params
}
```

### 2. Create Zod Schema

```typescript
const myToolSchema = z.object({
  apiId: z.string(),
  version: z.string(),
  operation: z.enum(['list', 'add', 'delete']),
  llmReason: z.string().optional(),
})
```

### 3. Implement Tool Class

```typescript
export class MyTool extends BaseTool<MyToolParams> {
  constructor(
    private specManager: SpecManager,
    private auditLogger: AuditLogger
  ) {
    super()
  }
  
  async execute(params: MyToolParams): Promise<ToolResult> {
    try {
      // 1. Validate
      const validated = this.validate(params, myToolSchema)
      
      // 2. Process
      switch (validated.operation) {
        case 'list':
          return await this.handleList(validated)
        case 'add':
          return await this.handleAdd(validated)
        case 'delete':
          return await this.handleDelete(validated)
      }
    } catch (error) {
      throw createToolError(...)
    }
  }
  
  describe(): ToolDescription {
    return {
      name: 'my_tool',
      description: 'Tool description',
      inputSchema: zodToJsonSchema(myToolSchema, 'myToolSchema'),
    }
  }
}
```

### 4. Register in Server

```typescript
// src/server.ts
const myTool = new MyTool(specManager, auditLogger)
tools.push(myTool)
```

## MCP Server Architecture

### HTTP/SSE Server (`src/server.ts`)

Handles both REST API and MCP SSE transport:

```typescript
// HTTP REST endpoints
GET  /health
GET  /tools
POST /tools/:toolName

// MCP SSE endpoints
GET  /mcp/sse     # SSE stream
POST /mcp/sse     # JSON-RPC methods (initialize, tools/list, tools/call)
```

### Tool Registration

```typescript
const tools: BaseTool[] = [
  new SpecReadTool(specManager),
  new SpecValidateTool(validationService),
  new MetadataUpdateTool(specManager, auditLogger),
  // ... all 10 tools
]
```

### Request Flow

```
Client Request
  → Fastify HTTP Handler
  → Tool Lookup by Name
  → Tool.execute(params)
  → Tool.validate(params)
  → Business Logic
  → Tool.success/error()
  → JSON Response
```

## Testing Tools

### Unit Test Pattern

```typescript
describe('MyTool', () => {
  let tool: MyTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>
  
  beforeEach(() => {
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
    } as any
    
    mockAuditLogger = {
      logEvent: jest.fn(),
    } as any
    
    tool = new MyTool(mockSpecManager, mockAuditLogger)
  })
  
  it('should execute successfully', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({...})
    
    const result = await tool.execute({
      apiId: 'test-api',
      version: 'v1.0.0',
      operation: 'list',
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual({...})
  })
})
```

## Best Practices

1. **Use dependency injection** for services
2. **Validate all inputs** with Zod
3. **Log operations** with context
4. **Provide LLM reasoning** for audit trail
5. **Use branded types** (ApiId, VersionTag)
6. **Write comprehensive JSDoc** with humor
7. **Test thoroughly** - unit and integration

## Related Documentation

- [Architecture](../architecture/README.md) - Overall system design
- [Tool Documentation](../tool-metadata-update/README.md) - Example tool
- [Utilities & Logging](../utilities-logging/README.md) - Helper functions

