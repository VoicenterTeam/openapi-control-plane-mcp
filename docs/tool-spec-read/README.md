# Spec Read Tool

## Overview

The `spec_read` tool is the gateway to querying OpenAPI specifications in the MCP server. It provides flexible query capabilities to retrieve full specifications, endpoint lists, schema details, and more. Think of it as your API documentation reader - ask it anything about your OpenAPI specs, and it delivers.

## Features

- ✅ Read full OpenAPI specifications
- ✅ Output specifications in JSON or YAML format
- ✅ List all endpoints with optional filtering
- ✅ Get detailed information for specific endpoints
- ✅ Query schema definitions
- ✅ Retrieve API metadata (info section)
- ✅ List configured servers
- ✅ Filter endpoints by tags and deprecation status
- ✅ Method-specific endpoint queries

## Usage

### Query Full Specification

Retrieve the complete OpenAPI specification document in JSON format (default):

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'full_spec',
  llmReason: 'User requested complete API specification',
})
```

Or retrieve it in YAML format:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'full_spec',
  format: 'yaml',
  llmReason: 'User needs specification in YAML format',
})
```

**YAML Response:**
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API description here
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Success
```

### List All Endpoints

Get a summary of all endpoints in the API:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
})
```

**Response:**
```json
{
  "endpoints": [
    { "path": "/users", "methods": ["GET", "POST"] },
    { "path": "/users/{id}", "methods": ["GET", "PUT", "DELETE"] },
    { "path": "/products", "methods": ["GET", "POST"] }
  ]
}
```

### Filter Endpoints by Method

List only endpoints with a specific HTTP method:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  method: 'GET',
})
```

### Filter Endpoints by Tags

Find endpoints tagged with specific categories:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  filters: {
    tags: ['admin', 'internal'],
  },
})
```

### Filter Deprecated Endpoints

List only deprecated (or non-deprecated) endpoints:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  filters: {
    deprecated: true,  // Set to false for non-deprecated only
  },
})
```

### Get Endpoint Details

Retrieve complete details for a specific endpoint:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  path: '/users/{id}',
  method: 'GET',
})
```

**Response:**
```json
{
  "path": "/users/{id}",
  "method": "GET",
  "operation": {
    "summary": "Get user by ID",
    "parameters": [...],
    "responses": {...},
    "tags": ["users"]
  }
}
```

### Get All Methods for a Path

Retrieve all operations defined on a specific path:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  path: '/users',
  // Omit method to get all methods
})
```

### Query Schema Details

Get the definition of a specific schema:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'schema_detail',
  schemaName: 'User',
})
```

**Response:**
```json
{
  "schemaName": "User",
  "schema": {
    "type": "object",
    "required": ["id", "name"],
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "email": { "type": "string", "format": "email" }
    }
  }
}
```

### Get API Information

Retrieve the info section (title, version, description, contact, license):

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'info',
})
```

**Response:**
```json
{
  "info": {
    "title": "My Awesome API",
    "version": "1.0.0",
    "description": "A comprehensive REST API",
    "contact": {
      "name": "API Team",
      "email": "api@example.com"
    }
  }
}
```

### List Server Configurations

Get all configured server URLs:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'servers',
})
```

**Response:**
```json
{
  "servers": [
    {
      "url": "https://api.example.com/v1",
      "description": "Production server"
    },
    {
      "url": "https://staging-api.example.com/v1",
      "description": "Staging server"
    }
  ]
}
```

## Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **apiId** | string | API identifier (kebab-case, e.g., `my-api`) |
| **version** | string | Version tag (semantic: `v1.2.3` or timestamp: `v20250109-120000`) |
| **queryType** | enum | Type of query to perform |

### Query Types

| Type | Description | Additional Parameters |
|------|-------------|----------------------|
| `full_spec` | Returns complete OpenAPI specification | `format` (optional: `json` or `yaml`, defaults to `json`) |
| `endpoints_list` | Lists all endpoints with optional filtering | `method`, `filters` |
| `endpoint_detail` | Returns details for a specific endpoint | `path` (required), `method` (optional) |
| `schema_detail` | Returns a schema definition | `schemaName` (required) |
| `info` | Returns the info section | None |
| `servers` | Returns server configurations | None |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **format** | enum | Output format for `full_spec`: `json` (default) or `yaml` |
| **path** | string | Endpoint path (required for `endpoint_detail`) |
| **method** | enum | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS` |
| **schemaName** | string | Schema name (required for `schema_detail`) |
| **filters** | object | Filtering options for `endpoints_list` |
| **filters.tags** | string[] | Filter by OpenAPI tags |
| **filters.deprecated** | boolean | Filter by deprecation status |
| **llmReason** | string | Optional explanation of why this query is being made |

## Response Structure

All responses follow the standard `ToolResult` format:

```typescript
{
  content: [
    { type: 'text', text: 'Success message' },
    { type: 'text', text: '{ "data": {...} }' }  // JSON stringified
  ],
  isError: false,
  success: true,
  data: { /* Query-specific data */ }
}
```

## Error Handling

### Common Errors

**API or Version Not Found:**
```typescript
// Error: Spec not found for apiId: non-existent-api, version: v1.0.0
```

**Endpoint Not Found:**
```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  path: '/nonexistent',
})
// Error: Endpoint not found: /nonexistent
```

**Method Not Found:**
```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  path: '/users',
  method: 'TRACE',  // If TRACE is not defined
})
// Error: Method TRACE not found for path: /users
```

**Schema Not Found:**
```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'schema_detail',
  schemaName: 'NonExistentSchema',
})
// Error: Schema not found: NonExistentSchema
```

**Missing Required Parameter:**
```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  // Missing 'path' parameter
})
// Error: path parameter is required for endpoint_detail
```

## Common Use Cases

### 1. API Discovery

List all available endpoints to understand API surface area:

```typescript
const result = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
})
// Use result.data.endpoints to explore the API
```

### 2. Find Deprecated Endpoints

Identify endpoints that need migration:

```typescript
const deprecated = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  filters: { deprecated: true },
})
```

### 3. Schema Inspection

Examine data models before making changes:

```typescript
const userSchema = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'schema_detail',
  schemaName: 'User',
})
```

### 4. Endpoint Documentation Retrieval

Get complete details for documentation generation:

```typescript
const endpoint = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoint_detail',
  path: '/users/{id}',
  method: 'GET',
})
// Access: endpoint.data.operation.summary, .parameters, .responses
```

### 5. Tag-based API Segmentation

Find all admin-only endpoints:

```typescript
const adminEndpoints = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  filters: { tags: ['admin'] },
})
```

## Best Practices

### Use Specific Queries

Instead of fetching the full spec and filtering in code, use the built-in query types and filters:

```typescript
// ❌ Not recommended
const fullSpec = await specReadTool.execute({ queryType: 'full_spec' })
const getEndpoints = Object.keys(fullSpec.data.spec.paths)
  .filter(p => 'get' in fullSpec.data.spec.paths[p])

// ✅ Recommended
const getEndpoints = await specReadTool.execute({
  queryType: 'endpoints_list',
  method: 'GET',
})
```

### Combine Filters

Use multiple filters to narrow down results:

```typescript
const criticalDeprecated = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
  filters: {
    tags: ['critical'],
    deprecated: true,
  },
})
```

### Provide LLM Reasoning

Help with debugging and audit trails:

```typescript
await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'schema_detail',
  schemaName: 'User',
  llmReason: 'Analyzing User schema before adding email validation field',
})
```

### Check Endpoint Existence Before Details

For better error handling:

```typescript
// First, list endpoints to verify existence
const endpoints = await specReadTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  queryType: 'endpoints_list',
})

if (endpoints.data.endpoints.some(e => e.path === '/users')) {
  // Then get details
  const details = await specReadTool.execute({
    queryType: 'endpoint_detail',
    path: '/users',
  })
}
```

## Integration with Other Tools

The `spec_read` tool is often used in conjunction with:

- **spec_validate** - Read spec, validate, fix issues
- **metadata_update** - Read info, update metadata
- **schema_manage** - Read schema, modify structure
- **endpoint_manage** - List endpoints, add new ones
- **version_control** - Compare specs across versions

## Performance Notes

- **Full Spec Query**: Returns entire document - use sparingly for large APIs
- **Endpoints List**: Efficient for API overview
- **Filtered Queries**: Slightly slower but still performant for reasonable API sizes
- **Detail Queries**: Very fast, direct lookups

## Related Documentation

- [Spec Validate Tool](../tool-spec-validate/README.md) - Validate specifications
- [Metadata Update Tool](../tool-metadata-update/README.md) - Update API metadata
- [Schema Manage Tool](../tool-schema-manage/README.md) - Manage schemas
- [Version Control Tool](../tool-spec-version/README.md) - Version management

---

**Need Help?** Check the [main documentation](../README.md) or [troubleshooting guide](../setup-guides/CURSOR-TROUBLESHOOTING.md).

