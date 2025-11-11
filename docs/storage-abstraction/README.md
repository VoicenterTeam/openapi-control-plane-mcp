# Storage Abstraction Layer

## Overview

The storage layer provides an abstract interface for persisting OpenAPI specifications and metadata, with a file-based implementation and support for future backends (S3, Redis, etc.).

## Architecture

```
BaseStorageProvider (Abstract)
        ↓
FileSystemStorage (Implementation)
        ↓
File System + Locking
```

## BaseStorageProvider Interface

All storage providers must implement:

### Methods

```typescript
abstract class BaseStorageProvider {
  // Read file content
  abstract read(key: string): Promise<string>
  
  // Write file content (atomic)
  abstract write(key: string, content: string): Promise<void>
  
  // Delete file
  abstract delete(key: string): Promise<void>
  
  // Check if file exists
  abstract exists(key: string): Promise<boolean>
  
  // List files with prefix
  abstract list(prefix: string): Promise<string[]>
  
  // Ensure directory exists
  abstract ensureDirectory(path: string): Promise<void>
}
```

## FileSystemStorage

File-based storage implementation with atomic writes and file locking.

### Features

- ✅ Atomic writes (write-then-rename pattern)
- ✅ File locking for concurrent access
- ✅ Recursive directory creation
- ✅ Configurable base path
- ✅ Error handling with StorageError

### Configuration

```typescript
const storage = new FileSystemStorage({
  basePath: './data'  // From DATA_DIR env variable
})
```

### File Structure

```
data/
  ├── apis/
  │   └── <api-id>/
  │       ├── metadata.json
  │       └── versions/
  │           └── <version>/
  │               └── spec.yaml
  └── audit/
      └── <api-id>-<timestamp>.log
```

### Atomic Write Pattern

```typescript
// 1. Write to temporary file
await fs.writeFile(`${path}.tmp.${Date.now()}`, content)

// 2. Atomic rename
await fs.rename(tempFile, finalPath)

// 3. Cleanup on error
```

### Concurrent Access

Uses `proper-lockfile` for safe concurrent operations:

```typescript
const unlock = await lock(filePath)
try {
  // Perform operation
} finally {
  await unlock()
}
```

## Adding New Storage Backend

### Example: S3Storage

```typescript
export class S3Storage extends BaseStorageProvider {
  private s3Client: S3Client
  
  constructor(config: { bucket: string, region: string }) {
    super()
    this.s3Client = new S3Client({ region: config.region })
  }
  
  async read(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key
    })
    const response = await this.s3Client.send(command)
    return await response.Body.transformToString()
  }
  
  async write(key: string, content: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: content
    })
    await this.s3Client.send(command)
  }
  
  // Implement other methods...
}
```

### Registering New Backend

```typescript
// src/config/storage-factory.ts
export function createStorage(type: string): BaseStorageProvider {
  switch (type) {
    case 'filesystem':
      return new FileSystemStorage({ basePath: config.DATA_DIR })
    case 's3':
      return new S3Storage({ bucket: config.S3_BUCKET, region: config.S3_REGION })
    case 'redis':
      return new RedisStorage({ host: config.REDIS_HOST })
    default:
      throw new Error(`Unknown storage type: ${type}`)
  }
}
```

## Error Handling

All storage operations throw `StorageError`:

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public path: string,
    public operation: 'read' | 'write' | 'delete' | 'list',
    public cause?: Error
  )
}
```

## Best Practices

1. **Always use abstract interface** - Don't depend on FileSystemStorage directly
2. **Handle errors gracefully** - Wrap in try-catch, provide context
3. **Use atomic operations** - Prevent partial writes
4. **Lock for safety** - Use file locking for concurrent access
5. **Clean up temp files** - Remove temporary files on error

## Testing

### Unit Tests

Mock the storage provider:

```typescript
const mockStorage = {
  read: jest.fn(),
  write: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  list: jest.fn(),
} as any

const specManager = new SpecManager(mockStorage)
```

### Integration Tests

Use real file system with test directory:

```typescript
const testStorage = new FileSystemStorage({
  basePath: './test-data'
})

afterEach(async () => {
  await fs.rm('./test-data', { recursive: true })
})
```

## Performance Considerations

### FileSystemStorage
- Read: Fast (disk I/O)
- Write: Moderate (atomic rename)
- List: Depends on directory size
- Lock acquisition: Usually instant, blocks if locked

### Future: S3Storage
- Read: Network latency (50-200ms)
- Write: Network latency (100-300ms)
- List: Moderate (S3 API pagination)
- No locking (use DynamoDB or versioning)

## Related Documentation

- [Architecture](../architecture/README.md) - System architecture
- [Spec Manager](../spec-manager/README.md) - Uses storage layer
- [Version Management](../version-management/README.md) - Version metadata storage

