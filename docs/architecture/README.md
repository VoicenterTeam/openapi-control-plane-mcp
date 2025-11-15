# OpenAPI Control Panel MCP - Architecture

## Overview

The OpenAPI Control Panel MCP Server is built with a clean, modular architecture following Uncle Bob's clean code principles. The system is designed for extensibility, testability, and maintainability.

## System Architecture

```
┌──────────────────────────────────────────┐
│          MCP Protocol Layer              │
│  (Stdio / SSE Transport)                 │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│            MCP Server                     │
│  - Tool Registration                      │
│  - Request Routing                        │
│  - JSON-RPC Handling                      │
└────────────┬──────────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│         10 MCP Tools (BaseTool)           │
│  - spec_read      - parameters_configure  │
│  - spec_validate  - responses_configure   │
│  - metadata_update- security_configure    │
│  - schema_manage  - references_manage     │
│  - endpoint_manage- version_control       │
└────────┬────────────────────────┬──────────┘
         │                        │
┌────────▼─────────┐   ┌──────────▼──────────┐
│    Services      │   │   Storage Layer     │
│                  │   │                     │
│ - SpecManager    │   │  BaseStorageProvider│
│ - ValidationSvc  │   │        ↓            │
│ - VersionMgr     │   │  FileSystemStorage  │
│ - AuditLogger    │   │  (Future: S3/Redis) │
│ - DiffCalculator │   └─────────────────────┘
└──────────────────┘
```

## Core Concepts

### Layered Architecture

1. **Protocol Layer** - MCP communication (stdio/SSE)
2. **Application Layer** - MCP tools and business logic
3. **Service Layer** - Reusable services (validation, versioning, etc.)
4. **Storage Layer** - Abstract storage with file system implementation

### Design Patterns

**BaseTool Pattern** - All MCP tools extend abstract BaseTool class
- Enforces consistent interface
- Provides validation, success/error helpers
- Enables easy testing with dependency injection

**Storage Abstraction** - BaseStorageProvider interface
- Decouples storage implementation from business logic
- Easy to swap file system → S3/Redis/etc.
- File locking for concurrent access safety

**Service Injection** - Services injected into tools
- Enables mocking for tests
- Promotes single responsibility
- Facilitates reuse across tools

**Branded Types** - TypeScript branded types for safety
- `ApiId` and `VersionTag` prevent string confusion
- Compile-time type safety
- Runtime validation at boundaries

## Data Flow

### Read Operation Flow
```
Client Request
  → MCP Server
  → Tool.execute()
  → SpecManager.loadSpec()
  → Storage.read()
  → Parse & Return
```

### Write Operation Flow
```
Client Request
  → MCP Server
  → Tool.execute()
  → Tool.validate(params)
  → SpecManager.loadSpec()
  → Modify spec
  → SpecManager.saveSpec()
  → Storage.write() (atomic)
  → AuditLogger.logEvent()
  → Return success
```

## Key Components

### MCP Server (`src/server.ts`)
- HTTP/SSE transport
- Tool registration
- JSON-RPC request handling
- Error handling

### MCP Tools (`src/tools/`)
- 10 tools for OpenAPI manipulation
- Each extends BaseTool
- Zod schema validation
- Comprehensive error handling

### Services (`src/services/`)
- **SpecManager**: Load/save specifications
- **ValidationService**: Spectral validation
- **VersionManager**: Version metadata & operations
- **AuditLogger**: Event logging with LLM reasoning
- **DiffCalculator**: Spec comparison & breaking changes

### Storage (`src/storage/`)
- **BaseStorageProvider**: Abstract interface
- **FileSystemStorage**: File-based implementation
- **LockManager**: Concurrent access control

### Types (`src/types/`)
- **mcp-tool.ts**: BaseTool abstract class
- **openapi.ts**: Branded types (ApiId, VersionTag)
- **errors.ts**: Error classes with serializeError
- **metadata.ts**: API and version metadata types

## Architectural Decisions

### Why File-Based Storage?
- Simple deployment (no external dependencies)
- Easy backup/restore
- Version control friendly (Git)
- Future-proof with storage abstraction

### Why Zod for Validation?
- Runtime type safety
- Clear error messages
- Easy JSON Schema generation
- TypeScript integration

### Why Spectral for OpenAPI Validation?
- Industry standard
- Extensible ruleset
- Detailed error reporting
- Active maintenance

### Why Branded Types?
- Prevents accidental string mixing
- Self-documenting code
- Catches bugs at compile time
- Minimal runtime overhead

## Security Considerations

### Current (v1.0)
- No authentication (designed for trusted environments)
- File system permissions for access control
- Input validation via Zod
- Safe file operations (atomic writes)

### Future (v2.0+)
- JWT/JWK authentication
- Role-based access control
- Rate limiting
- Audit trail encryption

## Performance Characteristics

### Read Operations
- Typical: 10-50ms
- Cached in memory during operation
- Scales with spec size

### Write Operations
- Typical: 50-200ms
- Includes validation, save, audit
- Atomic file operations

### Validation
- Spectral: 100-500ms (depends on spec size)
- Runs asynchronously
- Can be parallelized for batch operations

## Extensibility Points

### Adding New Tools
1. Create tool class extending BaseTool
2. Define Zod schema for parameters
3. Implement execute() method
4. Register in server.ts
5. Add tests

### Adding Storage Backend
1. Implement BaseStorageProvider interface
2. Handle read/write/list/exists/delete
3. Add configuration
4. Update factory in config

### Custom Validation Rules
1. Extend ValidationService
2. Add custom Spectral ruleset
3. Configure in environment

## Testing Strategy

### Unit Tests
- Each tool tested independently
- Services mocked via dependency injection
- 82.31% branch coverage achieved

### Integration Tests
- End-to-end tool workflows
- Real storage operations
- Version management scenarios

### Test Patterns
- Arrange-Act-Assert
- Mock external dependencies
- Test error paths explicitly
- Use fixtures for OpenAPI specs

## Related Documentation

- [Base Tool & Server](../base-tool-server/README.md) - BaseTool pattern details
- [Storage Abstraction](../storage-abstraction/README.md) - Storage layer design
- [Version Management](../version-management/README.md) - Versioning system
- [Spec Manager](../spec-manager/README.md) - Specification management
- [Utilities & Logging](../utilities-logging/README.md) - Cross-cutting concerns

