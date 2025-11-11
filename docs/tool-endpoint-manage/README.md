# Endpoint Manage Tool

## Overview

Manages API endpoints (paths and operations) in OpenAPI specifications. Full CRUD operations for endpoints with support for all HTTP methods.

## Features

- ✅ List all endpoints
- ✅ Add new endpoints
- ✅ Update existing endpoints
- ✅ Delete endpoints
- ✅ Support for all HTTP methods
- ✅ Audit logging

## Usage

### List Endpoints

```typescript
await endpointManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'list',
})
```

### Add Endpoint

```typescript
await endpointManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users/{id}',
  method: 'GET',
  operationObject: {
    summary: 'Get user by ID',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' }
          }
        }
      }
    }
  }
})
```

### Update Endpoint

```typescript
await endpointManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'update',
  path: '/users',
  method: 'GET',
  updates: {
    summary: 'List all users with pagination',
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
    ]
  }
})
```

### Delete Endpoint

```typescript
await endpointManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'delete',
  path: '/deprecated',
  method: 'POST',
})
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **version** | all | string | Version tag |
| **operation** | all | enum | `list`, `add`, `update`, `delete` |
| **path** | add, update, delete | string | Endpoint path |
| **method** | add, update, delete | enum | HTTP method |
| **operationObject** | add | object | Complete operation definition |
| **updates** | update | object | Fields to update |

## HTTP Methods

- GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

## Related Documentation

- [Spec Read Tool](../tool-spec-read/README.md)
- [Parameters Configure Tool](../tool-parameters-configure/README.md)
- [Responses Configure Tool](../tool-responses-configure/README.md)

