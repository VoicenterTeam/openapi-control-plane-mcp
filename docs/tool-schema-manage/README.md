# Schema Manage Tool

## Overview

The `schema_manage` tool manages OpenAPI schema definitions in the `components.schemas` section. It provides full CRUD (Create, Read, Update, Delete) operations for schema objects, enabling programmatic management of your API's data models.

## Features

- ✅ List all schema definitions
- ✅ Add new schemas
- ✅ Update existing schemas
- ✅ Delete schemas
- ✅ Support for all JSON Schema features
- ✅ Custom x- extensions
- ✅ Atomic operations with validation
- ✅ Full audit trail

## Usage

### List All Schemas

```typescript
await schemaManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'list',
})
```

**Response:**
```json
{
  "count": 3,
  "schemas": ["User", "Product", "Order"],
  "definitions": {
    "User": { "type": "object", ... },
    "Product": { "type": "object", ... },
    "Order": { "type": "object", ... }
  }
}
```

### Add New Schema

```typescript
await schemaManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  schemaName: 'User',
  schema: {
    type: 'object',
    required: ['id', 'email'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      age: { type: 'integer', minimum: 0 }
    }
  },
  llmReason: 'Adding User schema for authentication endpoints',
})
```

### Update Existing Schema

```typescript
await schemaManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'update',
  schemaName: 'User',
  schema: {
    properties: {
      phoneNumber: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' }
    }
  },
})
```

### Delete Schema

```typescript
await schemaManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'delete',
  schemaName: 'DeprecatedModel',
  llmReason: 'Removing unused schema from v1 API',
})
```

## Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **apiId** | string | API identifier |
| **version** | string | Version tag |
| **operation** | enum | `list`, `add`, `update`, `delete` |

### Operation-Specific Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **schemaName** | add, update, delete | string | Name of the schema |
| **schema** | add, update | object | Schema definition (JSON Schema) |
| **llmReason** | (optional) | string | Reason for operation |

## Schema Properties

The tool supports full JSON Schema Draft 7 / OpenAPI 3.0 schema features:

### Basic Types

```typescript
schema: {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null'
}
```

### Object Schemas

```typescript
schema: {
  type: 'object',
  properties: {
    field1: { type: 'string' },
    field2: { type: 'integer' }
  },
  required: ['field1'],
  additionalProperties: false
}
```

### Array Schemas

```typescript
schema: {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 100
}
```

### Composition

```typescript
schema: {
  allOf: [{ $ref: '#/components/schemas/Base' }, { properties: {...} }],
  // or anyOf, oneOf, not
}
```

### Validation Keywords

- **String**: `minLength`, `maxLength`, `pattern`, `format`
- **Number**: `minimum`, `maximum`, `multipleOf`
- **Array**: `minItems`, `maxItems`, `uniqueItems`
- **Object**: `minProperties`, `maxProperties`

## Common Use Cases

### 1. Create Complete Data Model

```typescript
await schemaManageTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add',
  schemaName: 'Product',
  schema: {
    type: 'object',
    required: ['id', 'name', 'price'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
      tags: { type: 'array', items: { type: 'string' } }
    }
  }
})
```

### 2. Add Custom Extensions

```typescript
schema: {
  type: 'object',
  properties: { ... },
  'x-internal': true,
  'x-visibility': 'private'
}
```

### 3. Schema Inheritance

```typescript
schema: {
  allOf: [
    { $ref: '#/components/schemas/BaseEntity' },
    {
      type: 'object',
      properties: {
        specificField: { type: 'string' }
      }
    }
  ]
}
```

## Error Handling

**Schema Already Exists:**
```typescript
// Error: Schema 'User' already exists. Use 'update' to modify it.
```

**Schema Not Found:**
```typescript
// Error: Schema 'NonExistent' not found
```

**Missing Required Parameter:**
```typescript
// Error: schemaName is required for add operation
```

## Best Practices

1. **Always specify required fields** for object schemas
2. **Use format validators** (`email`, `uuid`, `date-time`) when applicable
3. **Add descriptions** for better documentation
4. **Use refs** for schema composition
5. **Validate schemas** after adding/updating

## Related Documentation

- [Spec Read Tool](../tool-spec-read/README.md) - Query schemas
- [Metadata Update Tool](../tool-metadata-update/README.md) - Update API metadata
- [Endpoint Manage Tool](../tool-endpoint-manage/README.md) - Use schemas in endpoints

---

**Need Help?** Check the [main documentation](../README.md).

