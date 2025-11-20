/**
 * Migration Utility Unit Tests
 * 
 * @description Tests for the folder migration utility
 */

import { migrateToFolders, isMigrated, createDefaultFolders, rollbackMigration } from '../../src/utils/migrate-to-folders.js'
import { BaseStorageProvider } from '../../src/storage/base-storage-provider.js'

// Mock storage provider
class MockStorageProvider extends BaseStorageProvider {
  private storage: Map<string, string> = new Map()

  constructor() {
    super({ basePath: '/test' })
  }

  async read(key: string): Promise<string> {
    const value = this.storage.get(key)
    if (!value) throw new Error('Not found')
    return value
  }

  async write(key: string, data: string): Promise<void> {
    this.storage.set(key, data)
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key)
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async list(prefix: string): Promise<string[]> {
    const keys = Array.from(this.storage.keys())
    if (prefix === '/') return keys
    return keys.filter(key => key.startsWith(prefix))
  }

  async ensureDirectory(_path: string): Promise<void> {
    // No-op
  }

  clear() {
    this.storage.clear()
  }
}

describe('Migration Utility', () => {
  let storage: MockStorageProvider

  beforeEach(() => {
    storage = new MockStorageProvider()
  })

  afterEach(() => {
    storage.clear()
  })

  describe('isMigrated', () => {
    it('should return false when folders do not exist', async () => {
      const result = await isMigrated(storage)
      expect(result).toBe(false)
    })

    it('should return true when folders exist', async () => {
      await storage.write('active/_folder.json', '{}')
      await storage.write('recycled/_folder.json', '{}')

      const result = await isMigrated(storage)
      expect(result).toBe(true)
    })
  })

  describe('createDefaultFolders', () => {
    it('should create active and recycled folders', async () => {
      const created = await createDefaultFolders(storage)

      expect(created).toContain('active')
      expect(created).toContain('recycled')

      const activeExists = await storage.exists('active/_folder.json')
      const recycledExists = await storage.exists('recycled/_folder.json')

      expect(activeExists).toBe(true)
      expect(recycledExists).toBe(true)
    })

    it('should not create folders if they already exist', async () => {
      await storage.write('active/_folder.json', '{}')

      const created = await createDefaultFolders(storage)

      expect(created).toContain('recycled')
      expect(created).not.toContain('active')
    })
  })

  describe('migrateToFolders', () => {
    beforeEach(async () => {
      // Create some specs in flat structure
      await storage.write('api1/metadata.json', JSON.stringify({
        api_id: 'api1',
        name: 'API 1',
      }))
      await storage.write('api1/v1.0.0/spec.yaml', 'spec1')

      await storage.write('api2/metadata.json', JSON.stringify({
        api_id: 'api2',
        name: 'API 2',
      }))
      await storage.write('api2/v1.0.0/spec.yaml', 'spec2')
    })

    it('should migrate all specs to active folder', async () => {
      const results = await migrateToFolders(storage)

      expect(results.success).toBe(true)
      expect(results.specs_migrated).toBe(2)
      expect(results.migrated_specs).toContain('api1')
      expect(results.migrated_specs).toContain('api2')

      // Verify specs moved to active folder
      const api1Exists = await storage.exists('active/api1/metadata.json')
      const api2Exists = await storage.exists('active/api2/metadata.json')

      expect(api1Exists).toBe(true)
      expect(api2Exists).toBe(true)

      // Verify old locations deleted
      const oldApi1Exists = await storage.exists('api1/metadata.json')
      const oldApi2Exists = await storage.exists('api2/metadata.json')

      expect(oldApi1Exists).toBe(false)
      expect(oldApi2Exists).toBe(false)
    })

    it('should skip migration if already migrated', async () => {
      await migrateToFolders(storage)
      const results = await migrateToFolders(storage)

      expect(results.skipped).toBe(true)
      expect(results.specs_migrated).toBe(0)
    })

    it('should update metadata with folder field', async () => {
      await migrateToFolders(storage)

      const metadataContent = await storage.read('active/api1/metadata.json')
      const metadata = JSON.parse(metadataContent)

      expect(metadata.folder).toBe('active')
    })

    it('should be idempotent', async () => {
      const results1 = await migrateToFolders(storage)
      const results2 = await migrateToFolders(storage)

      expect(results1.success).toBe(true)
      expect(results2.skipped).toBe(true)
    })
  })

  describe('rollbackMigration', () => {
    it('should rollback specs from folder to root', async () => {
      // Create migrated structure
      await storage.write('active/_folder.json', '{}')
      await storage.write('active/api1/metadata.json', JSON.stringify({
        api_id: 'api1',
        folder: 'active',
      }))
      await storage.write('active/api1/v1.0.0/spec.yaml', 'spec')

      const count = await rollbackMigration(storage, 'active')

      expect(count).toBe(1)

      // Verify spec moved back to root
      const rootExists = await storage.exists('api1/metadata.json')
      expect(rootExists).toBe(true)

      // Verify folder field removed
      const metadataContent = await storage.read('api1/metadata.json')
      const metadata = JSON.parse(metadataContent)
      expect(metadata.folder).toBeUndefined()
    })
  })
})

