# Polished Examples & Walkthroughs

## Complete Workflow Examples

### Example 1: Creating a New API from Scratch

```typescript
// 1. Create initial version
await versionControlTool.execute({
  apiId: 'user-api',
  operation: 'create',
  version: 'v1.0.0',
  description: 'Initial user management API'
})

// 2. Update metadata
await metadataUpdateTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  updates: {
    title: 'User Management API',
    description: 'RESTful API for managing users',
    contact: {
      name: 'API Team',
      email: 'api@example.com'
    }
  }
})

// 3. Add User schema
await schemaManageTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  operation: 'add',
  schemaName: 'User',
  schema: {
    type: 'object',
    required: ['id', 'email'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' }
    }
  }
})

// 4. Add GET /users endpoint
await endpointManageTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users',
  method: 'GET',
  operationObject: {
    summary: 'List users',
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' }
            }
          }
        }
      }
    }
  }
})

// 5. Add pagination parameters
await parametersConfigureTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  operation: 'add',
  path: '/users',
  method: 'GET',
  parameter: {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', default: 1, minimum: 1 }
  }
})

// 6. Add API key security
await securityConfigureTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  operation: 'add_scheme',
  schemeName: 'apiKey',
  scheme: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key'
  }
})

await securityConfigureTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0',
  operation: 'set_global',
  security: [{ apiKey: [] }]
})

// 7. Validate everything
const validation = await specValidateTool.execute({
  apiId: 'user-api',
  version: 'v1.0.0'
})

console.log('API created and validated!', validation)
```

### Example 2: Evolving an API (v1 → v2)

```typescript
// 1. Create v2 from v1
await versionControlTool.execute({
  apiId: 'user-api',
  operation: 'create',
  version: 'v2.0.0',
  sourceVersion: 'v1.0.0',
  description: 'Add user roles and permissions'
})

// 2. Update User schema with new fields
await schemaManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'update',
  schemaName: 'User',
  schema: {
    properties: {
      role: { type: 'string', enum: ['admin', 'user', 'guest'] },
      permissions: { type: 'array', items: { type: 'string' } }
    }
  }
})

// 3. Add new admin-only endpoint
await endpointManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'add',
  path: '/admin/users',
  method: 'GET',
  operationObject: {
    summary: 'Admin: List all users',
    tags: ['admin'],
    security: [{ apiKey: [], oauth2: ['admin'] }],
    responses: {
      '200': { /* ... */ }
    }
  }
})

// 4. Compare versions for breaking changes
const diff = await versionControlTool.execute({
  apiId: 'user-api',
  operation: 'compare',
  fromVersion: 'v1.0.0',
  toVersion: 'v2.0.0'
})

console.log('Breaking changes:', diff.data.breaking)
console.log('New features:', diff.data.nonBreaking)
```

### Example 3: Refactoring and Cleanup

```typescript
// 1. Find where DeprecatedSchema is used
const usages = await referencesManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'find',
  componentType: 'schemas',
  componentName: 'DeprecatedSchema'
})

// 2. Update all references to new schema
await referencesManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'update',
  oldRef: '#/components/schemas/DeprecatedSchema',
  newRef: '#/components/schemas/ModernSchema'
})

// 3. Delete old schema
await schemaManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'delete',
  schemaName: 'DeprecatedSchema'
})

// 4. Validate no broken references
const validation = await referencesManageTool.execute({
  apiId: 'user-api',
  version: 'v2.0.0',
  operation: 'validate'
})

if (!validation.data.valid) {
  console.error('Broken references found!', validation.data.broken)
}
```

## Common Patterns

### Pattern: Add CRUD Endpoints

```typescript
async function addCRUDEndpoints(apiId: string, version: string, resourceName: string) {
  const endpoints = [
    { method: 'GET', path: `/${resourceName}`, summary: `List ${resourceName}` },
    { method: 'POST', path: `/${resourceName}`, summary: `Create ${resourceName}` },
    { method: 'GET', path: `/${resourceName}/{id}`, summary: `Get ${resourceName}` },
    { method: 'PUT', path: `/${resourceName}/{id}`, summary: `Update ${resourceName}` },
    { method: 'DELETE', path: `/${resourceName}/{id}`, summary: `Delete ${resourceName}` }
  ]
  
  for (const ep of endpoints) {
    await endpointManageTool.execute({
      apiId, version,
      operation: 'add',
      path: ep.path,
      method: ep.method,
      operationObject: { summary: ep.summary, responses: { '200': { /* ... */ } } }
    })
  }
}
```

### Pattern: Consistent Error Responses

```typescript
async function addStandardErrorResponses(apiId: string, version: string, path: string, method: string) {
  const errorResponses = [
    { code: '400', description: 'Bad Request' },
    { code: '401', description: 'Unauthorized' },
    { code: '404', description: 'Not Found' },
    { code: '500', description: 'Internal Server Error' }
  ]
  
  for (const { code, description } of errorResponses) {
    await responsesConfigureTool.execute({
      apiId, version, path, method,
      operation: 'add',
      statusCode: code,
      response: {
        description,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    })
  }
}
```

## Related Documentation

- [All MCP Tools](../README.md)
- [Architecture](../architecture/README.md)

