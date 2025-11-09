# TypeScript Types & Interfaces

## Overview

This module contains all TypeScript type definitions for the OpenAPI Control Plane MCP Server. Types are organized by domain and provide strong typing throughout the application.

## Type Modules

### OpenAPI Types (`openapi.ts`)

**Purpose**: Handle different OpenAPI specification versions with type safety.

**Key Types**:
- `ApiId`: Branded type for API identifiers (validates format)
- `VersionTag`: Branded type for version tags (semver or timestamp)
- `OpenAPIDocument`: Discriminated union for OpenAPI 2.0, 3.0, and 3.1
- `SwaggerV2Document`: Interface for Swagger 2.0 specs

**Type Guards**:
- `isOpenAPI30()`: Check if spec is OpenAPI 3.0
- `isOpenAPI31()`: Check if spec is OpenAPI 3.1
- `isSwagger20()`: Check if spec is Swagger 2.0

**Utilities**:
- `detectOpenAPIVersion()`: Automatically detect spec version
- `createApiId()`: Validate and create branded API ID
- `createVersionTag()`: Validate and create branded version tag

**Example**:
```typescript
import { detectOpenAPIVersion, createApiId } from './types/openapi'

const spec = await loadSpec()
const version = detectOpenAPIVersion(spec) // '3.0', '3.1', or '2.0'

const apiId = createApiId('my-api') // Throws if invalid format
```

### Metadata Types (`metadata.ts`)

**Purpose**: Define metadata structures for versioning, auditing, and custom extensions.

**Key Interfaces**:
- `VersionMetadata`: Complete version information (changes, stats, validation)
- `ApiMetadata`: API-level metadata (versions, owner, tags)
- `AuditEvent`: Audit trail entry with optional LLM reasoning
- `ChangesSummary`: Detailed change tracking between versions
- `ValidationResults`: Spectral and SwaggerParser validation output
- `CustomExtensionsConfig`: Configuration for custom x- attributes

**LLM Reasoning Support**:
All audit events include an optional `llmReason` field to capture why an LLM made a change:

```typescript
const event: AuditEvent = {
  timestamp: new Date().toISOString(),
  event: 'endpoint_added',
  api_id: apiId,
  user: 'llm:claude',
  llm_reason: 'Added /users endpoint to support user management requirements',
  details: { path: '/users', method: 'GET' }
}
```

**Custom x- Attributes**:
Environment variables with format `X_ATTRIBUTE_<ENTITY>_<NAME>=Description` are parsed into configuration:

```typescript
// .env
X_ATTRIBUTE_ENDPOINT_LOGO=Logo URL for endpoint documentation
X_ATTRIBUTE_PARAMETER_HINT=Usage hint for LLM

// Usage
const config = parseCustomExtensionsConfig()
// Access via lodash: get(spec, 'paths./users.get.properties.logo')
```

### Error Types (`errors.ts`)

**Purpose**: Standardized error types with detailed context.

**Error Categories**:
- `VALIDATION_ERROR`: Input validation failures
- `STORAGE_ERROR`: File system operation failures
- `TOOL_ERROR`: MCP tool execution errors
- `REFERENCE_ERROR`: $ref resolution errors
- `VERSION_ERROR`: Version management errors
- `PARSING_ERROR`: Spec parsing errors

**Error Interfaces**:
- `BaseError`: Common error structure
- `ValidationErrorDetails`: Field-level validation info
- `StorageErrorDetails`: Path and operation details
- `ToolErrorDetails`: Tool name and parameters
- `ReferenceErrorDetails`: $ref path and location

### MCP Tool Types (`mcp-tool.ts`)

**Purpose**: Define the contract for all MCP tools.

**Key Types**:
- `ToolResult`: Standard result format with content array
- `ToolDescription`: Tool metadata for MCP registration
- `BaseToolParams`: Common parameters including `llmReason`
- `BaseTool<T>`: Abstract base class all tools extend

**BaseTool Pattern**:
```typescript
export class MyTool extends BaseTool<MyParams> {
  async execute(params: MyParams): Promise<ToolResult> {
    // Validate
    const validated = this.validate(params, mySchema)
    
    // Execute logic
    const result = await doSomething(validated)
    
    // Return success or error
    return this.success('Operation completed', result)
  }

  describe(): ToolDescription {
    return {
      name: 'my_tool',
      description: 'Does something amazing',
      inputSchema: mySchema
    }
  }
}
```

## Design Patterns

### Branded Types
Uses TypeScript branded types to prevent mixing up similar strings:

```typescript
type ApiId = string & { __brand: 'ApiId' }
type VersionTag = string & { __brand: 'VersionTag' }

// This won't compile:
const apiId: ApiId = 'my-api' // Error!

// This works:
const apiId = createApiId('my-api') // Validated and branded
```

### Discriminated Unions
Type-safe handling of different OpenAPI versions:

```typescript
type OpenAPIDocument =
  | { version: '3.0'; spec: OpenAPIV3.Document }
  | { version: '3.1'; spec: OpenAPIV3_1.Document }
  | { version: '2.0'; spec: SwaggerV2Document }

function process(doc: OpenAPIDocument) {
  switch (doc.version) {
    case '3.0':
      // TypeScript knows doc.spec is OpenAPIV3.Document
      break
    case '3.1':
      // TypeScript knows doc.spec is OpenAPIV3_1.Document
      break
  }
}
```

## Next Steps

See:
- [Storage Abstraction](../storage-abstraction/README.md) - Storage layer implementation
- [Utilities](../utilities-logging/README.md) - Logger, errors, validation
- [Base Tool](../base-tool-server/README.md) - MCP tool implementation pattern

