# Integration Testing

## Overview

Integration tests verify end-to-end workflows using real services and storage.

## Test Structure

```
tests/integration/
  ├── tool-workflows.test.ts
  ├── version-management.test.ts
  ├── breaking-changes.test.ts
  └── fixtures/
      └── sample-apis/
```

## Example Integration Test

```typescript
describe('Version Management Workflow', () => {
  let storage: FileSystemStorage
  let specManager: SpecManager
  let versionManager: VersionManager
  let versionControlTool: VersionControlTool
  
  beforeEach(async () => {
    // Setup real services with test data
    storage = new FileSystemStorage({ basePath: './test-data' })
    specManager = new SpecManager(storage)
    versionManager = new VersionManager(storage)
    versionControlTool = new VersionControlTool(
      specManager,
      versionManager,
      auditLogger
    )
    
    // Create base API
    await setupTestAPI('test-api', 'v1.0.0')
  })
  
  afterEach(async () => {
    await fs.rm('./test-data', { recursive: true, force: true })
  })
  
  it('should create version from existing', async () => {
    // Create v2 from v1
    const result = await versionControlTool.execute({
      apiId: 'test-api',
      operation: 'create',
      version: 'v2.0.0',
      sourceVersion: 'v1.0.0',
      description: 'Version 2'
    })
    
    expect(result.success).toBe(true)
    
    // Verify v2 spec exists and matches v1
    const v1Spec = await specManager.loadSpec(
      createApiId('test-api'),
      createVersionTag('v1.0.0')
    )
    const v2Spec = await specManager.loadSpec(
      createApiId('test-api'),
      createVersionTag('v2.0.0')
    )
    
    expect(v2Spec.spec).toEqual(v1Spec.spec)
  })
  
  it('should detect breaking changes', async () => {
    // Modify v2 to introduce breaking change
    const { spec } = await specManager.loadSpec(
      createApiId('test-api'),
      createVersionTag('v2.0.0')
    )
    
    delete spec.paths['/users']  // Remove endpoint
    
    await specManager.saveSpec(
      createApiId('test-api'),
      createVersionTag('v2.0.0'),
      spec
    )
    
    // Compare versions
    const diff = await versionControlTool.execute({
      apiId: 'test-api',
      operation: 'compare',
      fromVersion: 'v1.0.0',
      toVersion: 'v2.0.0'
    })
    
    expect(diff.data.breaking.length).toBeGreaterThan(0)
  })
})
```

## Running Integration Tests

```bash
# All integration tests
npm run test:integration

# Specific test file
npm test -- tests/integration/version-management.test.ts
```

## Integration Test Best Practices

1. **Use real services** - No mocking for integration tests
2. **Clean up after tests** - Remove test data
3. **Test complete workflows** - Multiple operations in sequence
4. **Verify side effects** - Check storage, logs, metadata
5. **Test error recovery** - Ensure cleanup on failure

## Related Documentation

- [API Tools & Testing](../api-tools-testing/README.md)
- [MCP Testing](../mcp-testing/README.md)

