# Breaking Change Detection

## Overview

The system uses `oasdiff` to detect breaking changes between OpenAPI specification versions.

## What is a Breaking Change?

A breaking change is any modification that could cause existing API clients to fail:

### Examples

**Breaking:**
- Removing an endpoint
- Removing a required field
- Changing parameter type (string → integer)
- Making optional parameter required
- Removing enum values
- Changing response schema
- Changing authentication requirements

**Non-Breaking:**
- Adding new endpoint
- Adding optional parameter
- Adding new enum value
- Adding new response field
- Deprecating (but not removing) endpoint
- Adding more permissive validation

## Detection

Done via `DiffCalculator` service:

```typescript
const diff = await diffCalculator.calculateDiff(
  apiId,
  'v1.0.0',  // from
  'v2.0.0'   // to
)
```

Returns:
```typescript
{
  breaking: [
    {
      path: '/users/{id}',
      method: 'GET',
      change: 'removed required parameter: filter',
      severity: 'error'
    }
  ],
  nonBreaking: [...],
  summary: {
    breakingCount: 1,
    nonBreakingCount: 5
  }
}
```

## Using in CI/CD

```typescript
// Pre-deployment check
const diff = await versionControlTool.execute({
  operation: 'compare',
  fromVersion: 'v1.0.0',
  toVersion: 'v2.0.0'
})

if (diff.data.summary.breakingCount > 0) {
  console.error('Breaking changes detected!')
  process.exit(1)
}
```

## Versioning Strategy

- **Patch (v1.0.X)**: Bug fixes only, no breaking changes
- **Minor (v1.X.0)**: New features, backwards compatible
- **Major (vX.0.0)**: Breaking changes allowed

## Related Documentation

- [Version Control Tool](../tool-spec-version/README.md)
- [Version Management](../version-management/README.md)

