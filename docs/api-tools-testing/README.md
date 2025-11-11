# API Tools & Testing Strategies

## Testing MCP Tools

### Unit Testing Pattern

All tools follow this testing pattern:

```typescript
describe('ToolName', () => {
  let tool: ToolName
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>
  
  beforeEach(() => {
    // Create mocks
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
    } as any
    
    mockAuditLogger = {
      logEvent: jest.fn(),
    } as any
    
    // Inject mocks
    tool = new ToolName(mockSpecManager, mockAuditLogger)
  })
  
  describe('operation', () => {
    it('should handle success case', async () => {
      // Arrange
      mockSpecManager.loadSpec.mockResolvedValue({
        spec: { /* mock spec */ },
        format: 'yaml'
      })
      
      // Act
      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        operation: 'list'
      })
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
    
    it('should handle error case', async () => {
      // Arrange
      mockSpecManager.loadSpec.mockRejectedValue(
        new Error('Spec not found')
      )
      
      // Act & Assert
      await expect(tool.execute({...})).rejects.toThrow('Spec not found')
    })
  })
})
```

### Integration Testing

```typescript
describe('ToolName Integration', () => {
  let storage: FileSystemStorage
  let specManager: SpecManager
  let tool: ToolName
  
  beforeEach(async () => {
    // Use real dependencies with test data
    storage = new FileSystemStorage({ basePath: './test-data' })
    specManager = new SpecManager(storage)
    tool = new ToolName(specManager, auditLogger)
    
    // Create test fixtures
    await setupTestAPI()
  })
  
  afterEach(async () => {
    // Cleanup
    await fs.rm('./test-data', { recursive: true, force: true })
  })
  
  it('should work end-to-end', async () => {
    // Full workflow test
  })
})
```

## Test Coverage Goals

- **Lines**: 80%+ (achieved: 93.32%)
- **Branches**: 80%+ (achieved: 82.31%)
- **Functions**: 80%+ (achieved: 93.26%)
- **Statements**: 80%+ (achieved: 93.32%)

## Testing Strategies

### 1. Happy Path Testing
Test successful operations with valid inputs.

### 2. Error Path Testing
Test all error conditions:
- Invalid inputs
- Missing resources
- Storage failures
- Validation failures

### 3. Edge Case Testing
Test boundary conditions:
- Empty data
- Large data
- Special characters
- Concurrent access

### 4. Validation Testing
Test Zod schema validation:
- Required fields
- Type checking
- Format validation
- Custom validators

## Mocking Best Practices

### Mock Only External Dependencies
```typescript
// ✅ Good
const mockStorage = { read: jest.fn(), write: jest.fn() }

// ❌ Bad
const mockEverything = jest.mock('../entire-module')
```

### Use Type-Safe Mocks
```typescript
const mockSpecManager = {
  loadSpec: jest.fn(),
  saveSpec: jest.fn(),
} as jest.Mocked<SpecManager>
```

### Reset Mocks Between Tests
```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

## Test Fixtures

Store sample OpenAPI specs in `tests/fixtures/`:

```
tests/fixtures/
  ├── simple-api.yaml
  ├── complex-api.yaml
  ├── invalid-api.yaml
  └── x-attributes-api.yaml
```

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- spec-read-tool.test.ts

# Debug mode
npm run test:debug
```

## Coverage Reports

Generated in `coverage/`:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI

## Related Documentation

- [Base Tool Pattern](../base-tool-server/README.md)
- [Integration Tests](../integration-tests/README.md)
- [MCP Testing](../mcp-testing/README.md)

