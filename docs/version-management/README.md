# Version Management System

## Overview

The version management system handles API version metadata, comparisons, and diff generation using oasdiff for breaking change detection.

## Components

### VersionManager Service

Manages version metadata and operations.

### DiffCalculator Service

Calculates differences between spec versions and detects breaking changes using oasdiff.

## Version Metadata

Stored in `{DATA_DIR}/apis/{apiId}/metadata.json`:

```json
{
  "apiId": "my-api",
  "owner": "team-name",
  "createdAt": "2025-01-09T12:00:00Z",
  "updatedAt": "2025-01-09T14:30:00Z",
  "currentVersion": "v2.0.0",
  "versions": {
    "v1.0.0": {
      "tag": "v1.0.0",
      "description": "Initial release",
      "createdAt": "2025-01-09T12:00:00Z",
      "createdBy": "mcp-tool"
    },
    "v2.0.0": {
      "tag": "v2.0.0",
      "description": "Major update",
      "createdAt": "2025-01-09T14:30:00Z",
      "createdBy": "mcp-tool"
    }
  }
}
```

## Version Operations

### List Versions

```typescript
const versions = await versionManager.listVersions(apiId)
```

### Create Version

```typescript
await versionManager.createVersion(
  apiId,
  version,
  description,
  sourceVersion  // Optional: copy from existing
)
```

### Get Version Info

```typescript
const info = await versionManager.getVersion(apiId, version)
```

### Set Current

```typescript
await versionManager.setCurrentVersion(apiId, version)
```

### Delete Version

```typescript
await versionManager.deleteVersion(apiId, version)
```

## Diff Calculation

### Compare Versions

```typescript
const diff = await diffCalculator.calculateDiff(
  apiId,
  fromVersion,
  toVersion
)
```

Returns:
```typescript
{
  breaking: Array<BreakingChange>,
  nonBreaking: Array<Change>,
  summary: {
    breakingCount: number,
    nonBreakingCount: number,
    added: number,
    modified: number,
    deleted: number
  }
}
```

### Breaking Change Detection

Uses oasdiff to detect:
- Removed endpoints
- Removed required fields
- Changed parameter types
- Stricter validation rules
- Removed enum values
- Changed response schemas

## Version Format

### Semantic Versioning
```
v{major}.{minor}.{patch}
Examples: v1.0.0, v2.3.1
```

### Timestamp Versioning
```
v{YYYYMMDD}-{HHMMSS}
Examples: v20250109-120000
```

## Best Practices

1. **Use semantic versioning** for public APIs
2. **Increment major** for breaking changes
3. **Increment minor** for new features
4. **Increment patch** for bug fixes
5. **Compare before deploy** to detect breaking changes
6. **Keep changelog** in version descriptions

## Related Documentation

- [Version Control Tool](../tool-spec-version/README.md)
- [Breaking Changes](../breaking-changes/README.md)
- [Architecture](../architecture/README.md)

