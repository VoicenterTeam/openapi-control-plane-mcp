# Parameters Configure Tool

## Overview

Manages endpoint parameters (query, path, header, cookie) in OpenAPI specifications. Full CRUD operations for parameter configurations.

## Features

- ✅ List parameters for an endpoint
- ✅ Add new parameters
- ✅ Update existing parameters
- ✅ Delete parameters
- ✅ Support for all parameter types (query, path, header, cookie)
- ✅ Schema validation

## Usage

### List Parameters

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'list',
  path: '/users',
  method: 'GET',
})
```

### Add Parameter

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users',
  method: 'GET',
  parameter: {
    name: 'page',
    in: 'query',
    required: false,
    schema: { type: 'integer', default: 1, minimum: 1 },
    description: 'Page number for pagination'
  }
})
```

### Add Path Parameter

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users/{id}',
  method: 'GET',
  parameter: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'User ID'
  }
})
```

### Add Header Parameter

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users',
  method: 'GET',
  parameter: {
    name: 'X-API-Version',
    in: 'header',
    required: false,
    schema: { type: 'string' }
  }
})
```

### Update Parameter

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'update',
  path: '/users',
  method: 'GET',
  parameterName: 'page',
  parameterIn: 'query',
  updates: {
    description: 'Page number (1-indexed)',
    schema: { type: 'integer', minimum: 1, maximum: 1000 }
  }
})
```

### Delete Parameter

```typescript
await parametersConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'delete',
  path: '/users',
  method: 'GET',
  parameterName: 'deprecated_param',
  parameterIn: 'query',
})
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **version** | all | string | Version tag |
| **operation** | all | enum | `list`, `add`, `update`, `delete` |
| **path** | all | string | Endpoint path |
| **method** | list (optional), others | enum | HTTP method |
| **parameter** | add | object | Complete parameter definition |
| **parameterName** | update, delete | string | Parameter name to modify |
| **parameterIn** | update, delete | enum | Parameter location |
| **updates** | update | object | Fields to update |

## Parameter Locations

- **query**: URL query parameters (`?page=1`)
- **path**: URL path segments (`/users/{id}`)
- **header**: HTTP headers (`X-API-Key: abc`)
- **cookie**: Cookie values

## Parameter Schema

```typescript
{
  name: 'param_name',
  in: 'query' | 'path' | 'header' | 'cookie',
  required: boolean,
  schema: {
    type: 'string' | 'number' | 'integer' | 'boolean' | 'array',
    format: 'uuid' | 'email' | 'date-time' | ...,
    enum: [...],
    default: any,
    minimum: number,
    maximum: number,
    pattern: string
  },
  description: 'Parameter description',
  deprecated: boolean,
  allowEmptyValue: boolean,
  style: 'form' | 'simple' | ...,
  explode: boolean,
  example: any
}
```

## Best Practices

1. **Path parameters** must be marked as `required: true`
2. **Add descriptions** for all parameters
3. **Use format validators** when applicable
4. **Set sensible defaults** for optional query parameters
5. **Use enums** for parameters with fixed values

## Related Documentation

- [Endpoint Manage Tool](../tool-endpoint-manage/README.md)
- [Responses Configure Tool](../tool-responses-configure/README.md)

