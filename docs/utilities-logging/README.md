# Utilities & Logging

## Overview

Cross-cutting utilities including structured logging, error handling, validation, and helper functions.

## Logger (Pino)

Fast, structured JSON logger with multiple log levels.

### Usage

```typescript
import { logger } from '../utils/logger.js'

logger.info({ apiId, version }, 'Loading specification')
logger.error({ error, params }, 'Tool execution failed')
logger.debug({ data }, 'Processing request')
```

### Log Levels

- `fatal` - System crashes
- `error` - Operation failures
- `warn` - Warning conditions
- `info` - General information
- `debug` - Debugging information
- `trace` - Detailed traces

### Log Format

```json
{
  "level": 30,
  "time": 1704801600000,
  "pid": 12345,
  "hostname": "server",
  "msg": "Loading specification",
  "apiId": "my-api",
  "version": "v1.0.0"
}
```

### Configuration

Via environment variables:
```bash
LOG_LEVEL=info  # trace|debug|info|warn|error|fatal
```

## Error Utilities

### Error Classes

**ToolError**
```typescript
class ToolError extends Error {
  constructor(
    message: string,
    public details: { tool_name: string, params: any, cause?: Error }
  )
}
```

**StorageError**
```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public path: string,
    public operation: string,
    public cause?: Error
  )
}
```

**ValidationError**
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  )
}
```

### Error Creation Helpers

```typescript
createToolError(
  message: string,
  toolName: string,
  params: any,
  cause?: Error
): ToolError

createStorageError(
  message: string,
  path: string,
  operation: string,
  cause?: Error
): StorageError

createValidationError(
  message: string,
  field: string,
  value: any
): ValidationError
```

### Error Serialization

```typescript
serializeError(error: Error): Record<string, unknown>
```

Converts errors to JSON-safe objects with:
- message
- stack trace
- custom properties
- nested causes

## Validation Utilities

### API ID Validation

```typescript
validateApiId(id: string): string
```

Rules:
- Lowercase alphanumeric + hyphens
- Must start with letter or number
- No spaces or special characters

### Version Tag Validation

```typescript
validateVersionTag(tag: string): string
```

Formats:
- Semantic: `v1.2.3`
- Timestamp: `v20250109-120000`

### Branded Type Creation

```typescript
createApiId(id: string): ApiId
createVersionTag(tag: string): VersionTag
```

Validates and returns branded types for type safety.

## Storage Operation Logging

```typescript
logStorageOperation(
  operation: 'read' | 'write' | 'delete' | 'list',
  path: string,
  success: boolean,
  error?: Error
): void
```

Logs all storage operations with context.

## Best Practices

### Logging
1. **Use structured logging** - Add context objects
2. **Choose appropriate levels** - info for operations, debug for details
3. **Log errors with context** - Include operation params
4. **Avoid logging secrets** - Redact sensitive data

### Error Handling
1. **Catch and wrap errors** - Add context before rethrowing
2. **Use specific error types** - ToolError, StorageError, etc.
3. **Include causes** - Preserve error chain
4. **Provide actionable messages** - Help users fix issues

### Validation
1. **Validate at boundaries** - Tool inputs, API endpoints
2. **Use Zod for schemas** - Type-safe validation
3. **Provide clear error messages** - Explain what's wrong
4. **Use branded types** - Prevent string confusion

## Related Documentation

- [Architecture](../architecture/README.md)
- [Base Tool Pattern](../base-tool-server/README.md)
- [Storage Abstraction](../storage-abstraction/README.md)

