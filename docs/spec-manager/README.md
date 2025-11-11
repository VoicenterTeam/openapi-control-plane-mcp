# Spec Manager Service

## Overview

The SpecManager service handles loading and saving OpenAPI specifications with parsing, validation, and format detection.

## Features

- ✅ Load specs from storage
- ✅ Save specs to storage
- ✅ Auto-detect format (YAML/JSON)
- ✅ Parse and validate structure
- ✅ Support OpenAPI 3.0 and 3.1
- ✅ Error handling

## Usage

### Initialize

```typescript
const specManager = new SpecManager(storageProvider)
```

### Load Specification

```typescript
const { spec, format } = await specManager.loadSpec(
  createApiId('my-api'),
  createVersionTag('v1.0.0')
)
```

Returns:
```typescript
{
  spec: object,      // Parsed OpenAPI spec
  format: 'yaml' | 'json'
}
```

### Save Specification

```typescript
await specManager.saveSpec(
  createApiId('my-api'),
  createVersionTag('v1.0.0'),
  spec,
  'yaml'  // Optional, defaults to original format
)
```

## Spec Path Convention

```
{DATA_DIR}/apis/{apiId}/versions/{version}/spec.{yaml|json}
```

Example:
```
data/apis/my-api/versions/v1.0.0/spec.yaml
```

## Format Detection

Automatically detects format by file extension:
- `.yaml`, `.yml` → YAML
- `.json` → JSON

## Parsing

Uses `@apidevtools/swagger-parser`:
- Validates OpenAPI structure
- Resolves `$ref` references (optional)
- Reports parsing errors with line numbers

## Error Handling

Throws `ToolError` with context:
```typescript
// Spec not found
Error: Spec not found for apiId: my-api, version: v1.0.0

// Invalid format
Error: Failed to parse spec: Invalid YAML

// Save failed
Error: Failed to save spec: Write error
```

## Integration

Used by all tools that need to read/modify specs:

```typescript
// In tool constructor
constructor(private specManager: SpecManager) {
  super()
}

// In tool execute
const { spec } = await this.specManager.loadSpec(apiId, version)
// ... modify spec ...
await this.specManager.saveSpec(apiId, version, spec)
```

## Related Documentation

- [Storage Abstraction](../storage-abstraction/README.md)
- [Architecture](../architecture/README.md)

