# Metadata Update Tool

## Overview

The `metadata_update` tool is the first write operation implemented in the OpenAPI Control Plane MCP Server. It enables updating API metadata (the `info` section of an OpenAPI specification) with full validation and audit logging.

## Features

- ✅ Update title, version, description
- ✅ Update contact information (name, email, URL)
- ✅ Update license information  
- ✅ Add/update custom x- extensions
- ✅ Atomic updates with validation
- ✅ Full audit trail with LLM reasoning
- ✅ Change summarization

## Usage

### Basic Title Update

```typescript
await metadataUpdateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: {
    title: 'My Awesome API',
  },
  llmReason: 'User requested clearer API title',
})
```

### Update Multiple Fields

```typescript
await metadataUpdateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: {
    title: 'My Awesome API',
    description: 'A comprehensive REST API for managing resources',
    version: '2.0.0',
  },
})
```

### Update Contact Information

```typescript
await metadataUpdateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: {
    contact: {
      name: 'API Support Team',
      email: 'api-support@example.com',
      url: 'https://support.example.com',
    },
  },
})
```

### Update License

```typescript
await metadataUpdateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: {
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0',
    },
  },
})
```

### Add Custom x- Extensions

```typescript
await metadataUpdateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: {
    extensions: {
      logo: 'https://example.com/logo.png',
      category: 'payment',
      'x-internal': true,
    },
  },
})
```

**Note**: Extension keys are automatically prefixed with `x-` if not already present.

## Parameters

### Required Parameters

- **apiId** (string): API identifier (kebab-case, alphanumeric with hyphens)
- **version** (string): Version tag (semantic: `v1.2.3` or timestamp: `v20250109-120000`)
- **updates** (object): Metadata updates to apply

### Updates Object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | API title |
| `version` | string | API version string |
| `description` | string | API description |
| `termsOfService` | string (URL) | Terms of service URL |
| `contact` | object | Contact information |
| `contact.name` | string | Contact name |
| `contact.url` | string (URL) | Contact URL |
| `contact.email` | string (email) | Contact email |
| `license` | object | License information |
| `license.name` | string | License name |
| `license.url` | string (URL) | License URL |
| `extensions` | object | Custom x- extensions |
| `llmReason` | string (optional) | Reason for the update |

## Response

```typescript
{
  success: true,
  content: [{
    type: 'text',
    text: 'Metadata updated successfully'
  }],
  data: {
    apiId: 'my-api',
    version: 'v1.0.0',
    updated: {
      // Complete updated info object
    },
    changes: {
      // Summary of what changed
      title: {
        from: 'Old Title',
        to: 'New Title'
      }
    }
  }
}
```

## Validation

The tool validates:

- ✅ API ID format (kebab-case, no spaces)
- ✅ Version tag format (semantic or timestamp)
- ✅ Email addresses (when provided)
- ✅ URLs (when provided)
- ✅ Spec has an `info` section

Invalid inputs will throw a `ToolError` with descriptive message.

## Audit Logging

Every update is logged to `{apiId}/audit.json` with:

- Timestamp
- User (currently "system", will be replaced with actual user)
- Event type: "metadata_update"
- Original values
- Updated values
- LLM reason (if provided)

Example audit entry:

```json
{
  "api_id": "my-api",
  "version": "v1.0.0",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "event": "metadata_update",
  "user": "system",
  "details": {
    "action": "update_info",
    "updates": {
      "title": "New Title"
    },
    "original": {
      "title": "Old Title",
      "version": "1.0.0"
    },
    "updated": {
      "title": "New Title",
      "version": "1.0.0"
    }
  },
  "llm_reason": "User requested clearer title"
}
```

## Error Handling

The tool handles various error scenarios:

| Error | Cause | Action |
|-------|-------|--------|
| `Invalid API ID` | API ID format incorrect | Check format (kebab-case) |
| `Invalid version` | Version format incorrect | Use v1.2.3 or v20250109-120000 |
| `Spec not found` | API/version doesn't exist | Verify API ID and version |
| `No info section` | Spec missing info | Spec is invalid |
| `Invalid email` | Email format incorrect | Check email format |
| `Invalid URL` | URL format incorrect | Check URL format |

## Patterns Established

This tool establishes key patterns for all write operations:

1. **Load → Modify → Save**
   - Load current spec
   - Apply modifications
   - Save atomically

2. **Audit Everything**
   - Log before and after states
   - Include LLM reasoning
   - Track all changes

3. **Validation First**
   - Validate input parameters
   - Validate data formats
   - Fail fast with clear errors

4. **Change Summarization**
   - Track what changed
   - Provide useful feedback
   - Enable rollback

## Testing

The tool includes 17 comprehensive unit tests covering:

- ✅ Title, description, version updates
- ✅ Contact information updates
- ✅ License information updates
- ✅ Custom x- extension handling
- ✅ Multiple field updates
- ✅ Partial updates
- ✅ Field preservation
- ✅ LLM reason logging
- ✅ Change summarization
- ✅ Error handling (invalid ID, version, missing spec)

Run tests:

```bash
npm test -- metadata-update-tool
```

## Next Steps

This tool establishes the pattern for future write operations:

- **schema_manage**: CRUD for schema definitions
- **endpoint_manage**: Add/update/delete endpoints
- **parameters_configure**: Manage parameters
- **responses_configure**: Manage responses
- **security_configure**: Manage security schemes

All will follow the same patterns:
- Validation → Load → Modify → Save → Audit
- Comprehensive error handling
- Full test coverage
- Change summarization

## Integration

The tool is registered in `src/server.ts` and available via MCP:

```typescript
// List available tools
await mcp.tools.list() 
// Returns: ['spec_read', 'metadata_update', ...]

// Call the tool
await mcp.tools.call('metadata_update', {
  apiId: 'my-api',
  version: 'v1.0.0',
  updates: { title: 'New Title' }
})
```

---

**Status**: ✅ Complete  
**Tests**: 17/17 passing  
**Coverage**: 100%

