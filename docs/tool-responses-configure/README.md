# Responses Configure Tool

## Overview

Manages endpoint responses in OpenAPI specifications. Configure status codes, descriptions, content types, and response schemas for API operations.

## Features

- ✅ List responses for an endpoint
- ✅ Add new responses
- ✅ Update existing responses
- ✅ Delete responses
- ✅ Support for multiple status codes
- ✅ Content type configuration
- ✅ Response headers

## Usage

### List Responses

```typescript
await responsesConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'list',
  path: '/users',
  method: 'GET',
})
```

### Add Response

```typescript
await responsesConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users',
  method: 'POST',
  statusCode: '201',
  response: {
    description: 'User created successfully',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/User' }
      }
    },
    headers: {
      'Location': {
        description: 'URL of created resource',
        schema: { type: 'string', format: 'uri' }
      }
    }
  }
})
```

### Add Error Response

```typescript
await responsesConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users/{id}',
  method: 'GET',
  statusCode: '404',
  response: {
    description: 'User not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }
})
```

### Update Response

```typescript
await responsesConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'update',
  path: '/users',
  method: 'GET',
  statusCode: '200',
  updates: {
    description: 'List of users with pagination',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            total: { type: 'integer' },
            page: { type: 'integer' }
          }
        }
      }
    }
  }
})
```

### Delete Response

```typescript
await responsesConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'delete',
  path: '/users',
  method: 'GET',
  statusCode: '204',
})
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **version** | all | string | Version tag |
| **operation** | all | enum | `list`, `add`, `update`, `delete` |
| **path** | all | string | Endpoint path |
| **method** | all | enum | HTTP method |
| **statusCode** | add, update, delete | string | HTTP status code |
| **response** | add | object | Complete response definition |
| **updates** | update | object | Fields to update |

## Common Status Codes

### Success (2xx)
- **200** OK - Standard success response
- **201** Created - Resource created
- **204** No Content - Success with no response body

### Client Errors (4xx)
- **400** Bad Request - Invalid input
- **401** Unauthorized - Authentication required
- **403** Forbidden - Insufficient permissions
- **404** Not Found - Resource not found
- **409** Conflict - Resource conflict

### Server Errors (5xx)
- **500** Internal Server Error - Server failure
- **503** Service Unavailable - Temporary unavailability

## Response Object Structure

```typescript
{
  description: 'Response description',
  content: {
    'application/json': {
      schema: { /* JSON Schema */ },
      example: { /* Example response */ },
      examples: {
        'success': { value: {...} },
        'with_data': { value: {...} }
      }
    },
    'application/xml': { schema: {...} },
    'text/plain': { schema: { type: 'string' } }
  },
  headers: {
    'X-Rate-Limit': {
      description: 'Requests per hour',
      schema: { type: 'integer' }
    }
  },
  links: { /* Links to related operations */ }
}
```

## Content Types

Common content types:
- `application/json` - JSON data
- `application/xml` - XML data
- `text/plain` - Plain text
- `text/html` - HTML content
- `application/pdf` - PDF documents
- `image/png`, `image/jpeg` - Images

## Best Practices

1. **Always include descriptions** for all responses
2. **Use standard status codes** per HTTP semantics
3. **Define error responses** (400, 404, 500)
4. **Include examples** for clarity
5. **Use refs** for common response schemas
6. **Document headers** that clients should handle

## Common Use Cases

### Pagination Response

```typescript
response: {
  description: 'Paginated results',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {...} },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              perPage: { type: 'integer' },
              total: { type: 'integer' }
            }
          }
        }
      }
    }
  }
}
```

### File Download Response

```typescript
response: {
  description: 'File download',
  content: {
    'application/octet-stream': {
      schema: { type: 'string', format: 'binary' }
    }
  },
  headers: {
    'Content-Disposition': {
      schema: { type: 'string' },
      example: 'attachment; filename="report.pdf"'
    }
  }
}
```

## Related Documentation

- [Endpoint Manage Tool](../tool-endpoint-manage/README.md)
- [Parameters Configure Tool](../tool-parameters-configure/README.md)
- [Schema Manage Tool](../tool-schema-manage/README.md)

