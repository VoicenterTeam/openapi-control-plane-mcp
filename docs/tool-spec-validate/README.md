# Spec Validate Tool

## Overview

The `spec_validate` tool validates OpenAPI specifications using Spectral, the industry-standard OpenAPI linter. It identifies errors, warnings, and best practice violations in your API specifications, helping maintain high-quality, compliant OpenAPI documents.

## Features

- ✅ Validates against OpenAPI 3.0/3.1 standards
- ✅ Powered by Spectral with OAS ruleset
- ✅ Reports errors, warnings, info, and hints
- ✅ Configurable severity filtering
- ✅ Optional hint inclusion
- ✅ Detailed issue reporting with line numbers
- ✅ Summary statistics (errors, warnings, info, hints)
- ✅ Pass/fail validation status

## Usage

### Basic Validation

Validate a specification with default settings (errors, warnings, and info - no hints):

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  llmReason: 'Pre-deployment validation check',
})
```

**Response:**
```json
{
  "valid": false,
  "issueCount": 5,
  "summary": {
    "errors": 1,
    "warnings": 3,
    "info": 1,
    "hints": 0
  },
  "issues": [
    {
      "code": "info-description",
      "message": "Info object must have a description",
      "path": ["info"],
      "severity": 1,
      "range": { "start": { "line": 2, "character": 3 }, "end": {...} }
    }
  ]
}
```

### Include Hints

Get all validation feedback including hints (style suggestions):

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  includeHints: true,
})
```

### Filter by Severity Level

#### Errors Only

Show only critical errors that violate the OpenAPI specification:

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'error',
})
```

#### Warnings and Above

Show errors and warnings, excluding info and hints:

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'warning',
})
```

#### Info and Above

Show errors, warnings, and info messages:

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'info',
})
```

#### All Issues Including Hints

Show everything from errors down to style hints:

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'hint',
  includeHints: true,  // Must also set includeHints
})
```

## Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **apiId** | string | API identifier (kebab-case, e.g., `my-api`) |
| **version** | string | Version tag (semantic: `v1.2.3` or timestamp: `v20250109-120000`) |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **severityFilter** | enum | (none) | Minimum severity level: `error`, `warning`, `info`, `hint` |
| **includeHints** | boolean | `false` | Whether to include hint-level issues in results |
| **llmReason** | string | (none) | Optional explanation of why validation is being performed |

## Severity Levels

Spectral uses four severity levels, from most to least severe:

| Severity | Code | Description | Example |
|----------|------|-------------|---------|
| **Error** | 0 | Violations of OpenAPI specification | Missing required fields, invalid types |
| **Warning** | 1 | Potential problems | Unclear descriptions, missing examples |
| **Info** | 2 | Suggestions for improvement | Could add more details |
| **Hint** | 3 | Style recommendations | Formatting preferences |

## Response Structure

### Valid Specification

```json
{
  "valid": true,
  "issueCount": 0,
  "totalIssues": 0,
  "summary": {
    "errors": 0,
    "warnings": 0,
    "info": 0,
    "hints": 0
  },
  "issues": []
}
```

### Specification with Issues

```json
{
  "valid": false,
  "issueCount": 8,
  "totalIssues": 12,  // Before filtering
  "summary": {
    "errors": 2,
    "warnings": 4,
    "info": 2,
    "hints": 4
  },
  "issues": [
    {
      "code": "oas3-schema",
      "message": "Property must be equal to one of the allowed values",
      "path": ["paths", "/users", "get", "responses", "200", "content"],
      "severity": 0,
      "source": "/path/to/spec.yaml",
      "range": {
        "start": { "line": 45, "character": 7 },
        "end": { "line": 47, "character": 15 }
      }
    }
  ]
}
```

### Issue Object Properties

| Property | Type | Description |
|----------|------|-------------|
| **code** | string | Spectral rule code (e.g., `info-description`, `oas3-schema`) |
| **message** | string | Human-readable description of the issue |
| **path** | string[] | JSON path to the problematic location |
| **severity** | number | 0=Error, 1=Warning, 2=Info, 3=Hint |
| **source** | string | Source file path |
| **range** | object | Line and character range in the source |

## Common Validation Rules

### Spectral OAS Ruleset

The tool uses Spectral's built-in OpenAPI ruleset, which includes:

**Info Object Rules:**
- `info-contact` - API should have contact info
- `info-description` - API must have description
- `info-license` - API should have license

**Operation Rules:**
- `operation-description` - Operations should have descriptions
- `operation-operationId` - Operations should have unique operationIds
- `operation-tags` - Operations should be tagged
- `operation-tag-defined` - Tags must be defined in global tags

**Parameter Rules:**
- `operation-parameters` - Parameters should have descriptions
- `path-params` - Path parameters must be defined

**Response Rules:**
- `operation-success-response` - Operations should have 2xx responses
- `oas3-valid-media-example` - Examples should match schema

**Schema Rules:**
- `oas3-schema` - Schemas must be valid JSON Schema
- `typed-enum` - Enums should have type specified

## Error Handling

### API Not Found

```typescript
await specValidateTool.execute({
  apiId: 'nonexistent-api',
  version: 'v1.0.0',
})
// Error: Spec not found for apiId: nonexistent-api, version: v1.0.0
```

### Invalid Version Format

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: '1.0.0',  // Missing 'v' prefix
})
// Error: Invalid version format
```

### Validation Service Failure

If Spectral encounters a critical error:

```typescript
// Error: Validation service failed: [detailed error message]
```

## Common Use Cases

### 1. Pre-Commit Validation

Validate specs before committing changes:

```typescript
const result = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'error',  // Block on errors only
  llmReason: 'Pre-commit validation',
})

if (!result.data.valid) {
  // Block commit
  console.error('Spec has errors - commit blocked')
}
```

### 2. Quality Gate in CI/CD

Enforce quality standards in your pipeline:

```typescript
const result = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'warning',  // Fail on warnings and errors
})

if (result.data.summary.errors > 0 || result.data.summary.warnings > 0) {
  throw new Error('Spec quality gate failed')
}
```

### 3. Development Feedback

Get comprehensive feedback during development:

```typescript
const result = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  includeHints: true,  // Get all suggestions
})

// Show all issues to developer
result.data.issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.message} at ${issue.path.join('.')}`)
})
```

### 4. Documentation Quality Check

Ensure API documentation completeness:

```typescript
const result = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
})

// Check for missing descriptions
const descriptionIssues = result.data.issues.filter(i =>
  i.code.includes('description')
)

if (descriptionIssues.length > 0) {
  console.log('Documentation incomplete:', descriptionIssues)
}
```

### 5. Breaking Change Detection

Validate after modifications:

```typescript
// After updating spec
const validation = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v2.0.0',
  severityFilter: 'error',
  llmReason: 'Post-modification validation',
})

if (!validation.data.valid) {
  // Modifications introduced errors
  console.error('New errors introduced')
}
```

## Best Practices

### Always Validate Before Deployment

```typescript
// ✅ Good practice
const valid = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  severityFilter: 'error',
})

if (valid.data.valid) {
  // Proceed with deployment
}
```

### Use Appropriate Severity Filters

```typescript
// ✅ For production: errors only
severityFilter: 'error'

// ✅ For staging: errors and warnings
severityFilter: 'warning'

// ✅ For development: all issues
includeHints: true
```

### Provide LLM Reasoning

Help with audit trails:

```typescript
await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  llmReason: 'User requested validation before publishing API to external partners',
})
```

### Handle Validation Results Programmatically

```typescript
const result = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
})

// Group by severity
const errors = result.data.issues.filter(i => i.severity === 0)
const warnings = result.data.issues.filter(i => i.severity === 1)

// Prioritize fixes
if (errors.length > 0) {
  console.log('Critical issues to fix:', errors)
}
```

### Integrate with Version Control

```typescript
// Validate before creating new version
const preCheck = await specValidateTool.execute({
  apiId: 'my-api',
  version: 'v1.5.0',
  severityFilter: 'error',
})

if (preCheck.data.valid) {
  // Safe to create version
  await versionControlTool.execute({
    operation: 'create',
    version: 'v2.0.0',
  })
}
```

## Spectral Configuration

The validation service uses Spectral's default OAS ruleset. For custom rules, the underlying `ValidationService` can be configured (see [utilities-logging](../utilities-logging/README.md)).

## Performance Notes

- Validation typically takes 100-500ms for medium-sized specs
- Large specs (1000+ paths) may take 1-2 seconds
- Results are not cached - each call performs fresh validation
- Consider validating only on significant changes, not every keystroke

## Integration with Other Tools

The `spec_validate` tool works well with:

- **spec_read** - Read spec, then validate
- **metadata_update** - Update, then validate
- **schema_manage** - Modify schemas, validate changes
- **version_control** - Validate before version creation

## Related Documentation

- [Spec Read Tool](../tool-spec-read/README.md) - Read specifications
- [Metadata Update Tool](../tool-metadata-update/README.md) - Update API metadata
- [Version Control Tool](../tool-spec-version/README.md) - Version management
- [Validation Service](../utilities-logging/README.md) - Underlying validation service

---

**Need Help?** Check the [main documentation](../README.md) or [troubleshooting guide](../setup-guides/CURSOR-TROUBLESHOOTING.md).

