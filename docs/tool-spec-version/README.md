# Version Control Tool

## Overview

Manages API versions with full version control capabilities including creation, comparison, and diff generation using oasdiff for breaking change detection.

## Features

- ✅ List all versions
- ✅ Create new versions
- ✅ Get version metadata
- ✅ Compare versions with diff
- ✅ Set current version
- ✅ Delete versions
- ✅ Breaking change detection

## Usage

### List Versions

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'list',
})
```

### Create Version

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'create',
  version: 'v2.0.0',
  description: 'Major release with new endpoints',
  sourceVersion: 'v1.0.0',  // Copy from existing
})
```

### Get Version Info

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'get',
  version: 'v1.0.0',
})
```

### Compare Versions

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'compare',
  fromVersion: 'v1.0.0',
  toVersion: 'v2.0.0',
})
```

**Response includes:**
- Breaking changes
- Non-breaking changes
- Deprecated features
- Added/removed endpoints

### Set Current Version

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'set_current',
  version: 'v2.0.0',
})
```

### Delete Version

```typescript
await versionControlTool.execute({
  apiId: 'my-api',
  operation: 'delete',
  version: 'v1.0.0-beta',
})
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **operation** | all | enum | `list`, `create`, `get`, `compare`, `set_current`, `delete` |
| **version** | create, get, set_current, delete | string | Version tag (v1.2.3) |
| **fromVersion** | compare | string | Source version for comparison |
| **toVersion** | compare | string | Target version for comparison |
| **description** | create (optional) | string | Version description |
| **sourceVersion** | create (optional) | string | Version to copy from |

## Version Format

- Semantic: `v1.2.3` (major.minor.patch)
- Timestamp: `v20250109-120000`

## Breaking Change Detection

The compare operation uses oasdiff to detect:
- Removed endpoints
- Changed parameter types
- Removed required fields
- Modified response schemas
- Authentication changes

## Related Documentation

- [Spec Read Tool](../tool-spec-read/README.md)
- [Breaking Changes](../breaking-changes/README.md)

