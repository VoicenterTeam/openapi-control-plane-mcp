# References Manage Tool

## Overview

Manages `$ref` references in OpenAPI specifications. Find component usages, validate all references, and update reference paths across the specification.

## Features

- ✅ Find all usages of a component
- ✅ Validate all references
- ✅ Update reference paths
- ✅ Detect broken references
- ✅ Support for schemas, responses, parameters, etc.

## Usage

### Find Component Usages

```typescript
await referencesManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'find',
  componentType: 'schemas',
  componentName: 'User',
})
```

**Response:**
```json
{
  "usages": [
    {
      "path": ["paths", "/users", "get", "responses", "200", "content", "application/json", "schema"],
      "ref": "#/components/schemas/User"
    },
    {
      "path": ["paths", "/users/{id}", "get", "responses", "200", "content", "application/json", "schema"],
      "ref": "#/components/schemas/User"
    }
  ],
  "count": 2
}
```

### Validate All References

```typescript
await referencesManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'validate',
})
```

**Response:**
```json
{
  "valid": false,
  "broken": [
    {
      "ref": "#/components/schemas/DeletedModel",
      "locations": [
        ["paths", "/products", "post", "requestBody", "content", "application/json", "schema"]
      ]
    }
  ],
  "brokenCount": 1
}
```

### Update References

```typescript
await referencesManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'update',
  oldRef: '#/components/schemas/User',
  newRef: '#/components/schemas/UserV2',
})
```

**Response:**
```json
{
  "updateCount": 5,
  "locations": [
    ["paths", "/users", "get", "responses", "200", ...],
    ["paths", "/users/{id}", "get", "responses", "200", ...],
    ...
  ]
}
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **version** | all | string | Version tag |
| **operation** | all | enum | `find`, `validate`, `update` |
| **componentType** | find | enum | Component type |
| **componentName** | find | string | Component name |
| **oldRef** | update | string | Reference to replace |
| **newRef** | update | string | New reference value |

## Component Types

- **schemas** - Schema definitions
- **responses** - Response definitions
- **parameters** - Parameter definitions
- **examples** - Example definitions
- **requestBodies** - Request body definitions
- **headers** - Header definitions

## Reference Formats

### Component Reference
```
#/components/schemas/User
#/components/responses/NotFound
#/components/parameters/PageParam
```

### External Reference
```
./common.yaml#/components/schemas/Error
https://api.example.com/schemas/common.yaml#/User
```

## Common Use Cases

### Before Deleting a Schema

Check if schema is still in use:

```typescript
const usages = await referencesManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'find',
  componentType: 'schemas',
  componentName: 'DeprecatedModel',
})

if (usages.data.count === 0) {
  // Safe to delete
  await schemaManageTool.execute({
    operation: 'delete',
    schemaName: 'DeprecatedModel'
  })
}
```

### Rename a Schema

Update all references when renaming:

```typescript
// 1. Find all usages (optional verification)
const usages = await referencesManageTool.execute({
  operation: 'find',
  componentType: 'schemas',
  componentName: 'OldName',
})

// 2. Update all references
await referencesManageTool.execute({
  operation: 'update',
  oldRef: '#/components/schemas/OldName',
  newRef: '#/components/schemas/NewName',
})

// 3. Rename the schema
await schemaManageTool.execute({
  operation: 'delete',
  schemaName: 'OldName',
})
await schemaManageTool.execute({
  operation: 'add',
  schemaName: 'NewName',
  schema: { /* schema definition */ }
})
```

### Pre-deployment Validation

Ensure no broken references before deployment:

```typescript
const validation = await referencesManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'validate',
})

if (!validation.data.valid) {
  console.error('Broken references found:', validation.data.broken)
  // Block deployment
}
```

### Refactoring Shared Components

```typescript
// Move User schema to shared definitions
await referencesManageTool.execute({
  operation: 'update',
  oldRef: '#/components/schemas/User',
  newRef: './shared.yaml#/components/schemas/User',
})
```

## Best Practices

1. **Validate before deployment** - Always check for broken references
2. **Find before delete** - Check usage before removing components
3. **Update atomically** - Update references when renaming components
4. **Use meaningful names** - Makes references easier to track
5. **Document external refs** - Comment external reference purposes

## Error Handling

**Component Not Found:**
```typescript
// Error: Component schemas/NonExistent not found
```

**Invalid Reference Format:**
```typescript
// Error: Invalid reference format: components/schemas/User (missing #)
```

## Related Documentation

- [Schema Manage Tool](../tool-schema-manage/README.md)
- [Spec Read Tool](../tool-spec-read/README.md)
- [Spec Validate Tool](../tool-spec-validate/README.md)

