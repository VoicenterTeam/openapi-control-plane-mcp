# Audit Logging System

## Overview

The AuditLogger service provides comprehensive audit trail functionality, capturing all modifications to OpenAPI specifications with optional LLM reasoning.

## Features

- ✅ Event logging for all operations
- ✅ LLM reasoning capture
- ✅ Timestamp tracking
- ✅ User identification
- ✅ Detailed operation context
- ✅ Append-only log files

## Audit Event Structure

```typescript
interface AuditEvent {
  api_id: ApiId
  version: VersionTag
  timestamp: string  // ISO 8601
  event: string      // Event type
  user: string       // User or 'mcp-tool'
  llm_reason?: string
  details: Record<string, unknown>
}
```

## Event Types

### Spec Operations
- `spec_read` - Specification queried
- `spec_validated` - Validation performed

### Metadata Operations
- `metadata_update` - Info section modified
- `version_created` - New version created
- `version_deleted` - Version removed

### Schema Operations
- `schema_added` - Schema definition added
- `schema_updated` - Schema modified
- `schema_deleted` - Schema removed

### Endpoint Operations
- `endpoint_added` - New endpoint created
- `endpoint_updated` - Endpoint modified
- `endpoint_deleted` - Endpoint removed

### Parameter Operations
- `parameter_added` - Parameter added
- `parameter_updated` - Parameter modified
- `parameter_deleted` - Parameter removed

### Response Operations
- `response_added` - Response added
- `response_updated` - Response modified
- `response_deleted` - Response removed

### Security Operations
- `security_scheme_added` - Security scheme added
- `security_scheme_deleted` - Security scheme removed
- `global_security_updated` - Global security changed

### Reference Operations
- `references_validated` - References checked
- `references_updated` - References modified

## Usage

### Log an Event

```typescript
await auditLogger.logEvent({
  api_id: createApiId('my-api'),
  version: createVersionTag('v1.0.0'),
  timestamp: new Date().toISOString(),
  event: 'endpoint_added',
  user: 'mcp-tool',
  llm_reason: 'User requested new user management endpoint',
  details: {
    path: '/users',
    method: 'GET',
    summary: 'List users'
  }
})
```

## Log File Format

Stored as append-only NDJSON (Newline Delimited JSON):

```
{DATA_DIR}/audit/{apiId}-{timestamp}.log
```

Example:
```
{"api_id":"my-api","version":"v1.0.0","timestamp":"2025-01-09T12:00:00Z","event":"schema_added",...}
{"api_id":"my-api","version":"v1.0.0","timestamp":"2025-01-09T12:05:00Z","event":"endpoint_added",...}
```

## Querying Audit Logs

Currently file-based. Future versions may include:
- SQL database for structured queries
- Elasticsearch for full-text search
- Time-range filtering
- Event type filtering
- LLM reasoning search

## LLM Reasoning

Captures why LLMs make changes:

```typescript
{
  llm_reason: "User requested to add email validation to User schema because current implementation allows invalid email formats"
}
```

Benefits:
- Debugging unexpected changes
- Understanding decision context
- Compliance and audit trails
- LLM behavior analysis

## Best Practices

1. **Always log modifications** - Read-only operations optional
2. **Capture LLM reasoning** when available
3. **Include relevant details** - Paths, schemas, values
4. **Use consistent event names** - Follow established conventions
5. **Never modify logs** - Append-only for integrity

## Security Considerations

### Current
- File system permissions
- No PII in logs (API IDs only)
- Clear text storage

### Future
- Encryption at rest
- Signed log entries
- Tamper detection
- PII redaction

## Integration

All write tools automatically log events:

```typescript
// In tool execute method
await this.auditLogger.logEvent({
  api_id: apiId,
  version,
  event: 'schema_added',
  user: 'mcp-tool',
  timestamp: new Date().toISOString(),
  llm_reason: params.llmReason,
  details: { schemaName: params.schemaName }
})
```

## Related Documentation

- [Architecture](../architecture/README.md)
- [All MCP Tools](../README.md)

