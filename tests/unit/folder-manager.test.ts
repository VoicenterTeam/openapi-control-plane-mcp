/**
 * Folder Manager Unit Tests
 * 
 * @description Tests for the FolderManager service that manages workspace folders
 */

import { FolderManager } from '../../src/services/folder-manager.js'
import { BaseStorageProvider } from '../../src/storage/base-storage-provider.js'
import type { ApiId } from '../../src/types/openapi.js'

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
    return keys.filter(key => key.startsWith(prefix) || prefix === '/')
  }

  async ensureDirectory(_path: string): Promise<void> {
    // No-op for mock
  }

  clear() {
    this.storage.clear()
  }
}

describe('FolderManager', () => {
  let storage: MockStorageProvider
  let folderManager: FolderManager

  beforeEach(() => {
    storage = new MockStorageProvider()
    folderManager = new FolderManager(storage)
  })

  afterEach(() => {
    storage.clear()
  })

  describe('createFolder', () => {
    it('should create a folder with valid metadata', async () => {
      const folder = await folderManager.createFolder('test-folder', {
        title: 'Test Folder',
        description: 'A test folder',
        color: '#10b981',
      })

      expect(folder.name).toBe('test-folder')
      expect(folder.title).toBe('Test Folder')
      expect(folder.description).toBe('A test folder')
      expect(folder.color).toBe('#10b981')
      expect(folder.created_at).toBeDefined()
      expect(folder.spec_count).toBe(0)
    })

    it('should fail with invalid folder name (uppercase)', async () => {
      await expect(
        folderManager.createFolder('TestFolder', { title: 'Test' })
      ).rejects.toThrow('kebab-case')
    })

    it('should fail with invalid folder name (spaces)', async () => {
      await expect(
        folderManager.createFolder('test folder', { title: 'Test' })
      ).rejects.toThrow('kebab-case')
    })

    it('should fail with invalid folder name (special chars)', async () => {
      await expect(
        folderManager.createFolder('test@folder', { title: 'Test' })
      ).rejects.toThrow('kebab-case')
    })

    it('should fail when creating duplicate folder', async () => {
      await folderManager.createFolder('test-folder', { title: 'Test' })
      
      await expect(
        folderManager.createFolder('test-folder', { title: 'Test' })
      ).rejects.toThrow('already exists')
    })
  })

  describe('listFolders', () => {
    it('should list all folders with spec counts', async () => {
      await folderManager.createFolder('folder1', { title: 'Folder 1' })
      await folderManager.createFolder('folder2', { title: 'Folder 2' })

      const folders = await folderManager.listFolders(true)

      expect(folders).toHaveLength(2)
      expect(folders[0].spec_count).toBeDefined()
    })

    it('should return empty array when no folders exist', async () => {
      const folders = await folderManager.listFolders()
      expect(folders).toEqual([])
    })
  })

  describe('getFolderMetadata', () => {
    it('should get folder metadata', async () => {
      await folderManager.createFolder('test-folder', {
        title: 'Test Folder',
        description: 'Test description',
      })

      const folder = await folderManager.getFolderMetadata('test-folder')

      expect(folder.name).toBe('test-folder')
      expect(folder.title).toBe('Test Folder')
    })

    it('should fail for non-existent folder', async () => {
      await expect(
        folderManager.getFolderMetadata('non-existent')
      ).rejects.toThrow()
    })
  })

  describe('updateFolderMetadata', () => {
    it('should update folder metadata', async () => {
      await folderManager.createFolder('test-folder', { title: 'Original' })

      const updated = await folderManager.updateFolderMetadata('test-folder', {
        title: 'Updated',
        description: 'New description',
      })

      expect(updated.title).toBe('Updated')
      expect(updated.description).toBe('New description')
    })
  })

  describe('deleteFolder', () => {
    it('should delete empty folder', async () => {
      await folderManager.createFolder('test-folder', { title: 'Test' })
      
      await folderManager.deleteFolder('test-folder')
      
      await expect(
        folderManager.getFolderMetadata('test-folder')
      ).rejects.toThrow()
    })

    it('should fail to delete folder with specs', async () => {
      await folderManager.createFolder('test-folder', { title: 'Test' })
      
      // Add a spec to the folder
      await storage.write('test-folder/api1/metadata.json', JSON.stringify({
        api_id: 'api1',
        name: 'API 1',
      }))

      await expect(
        folderManager.deleteFolder('test-folder')
      ).rejects.toThrow('contains')
    })
  })

  describe('moveSpec', () => {
    beforeEach(async () => {
      // Create folders
      await folderManager.createFolder('source', { title: 'Source' })
      await folderManager.createFolder('target', { title: 'Target' })
      
      // Create a spec in source folder
      await storage.write('source/test-api/metadata.json', JSON.stringify({
        api_id: 'test-api',
        name: 'Test API',
      }))
      await storage.write('source/test-api/v1.0.0/spec.yaml', 'spec content')
    })

    it('should move spec between folders', async () => {
      await folderManager.moveSpec('test-api' as ApiId, 'source', 'target')

      // Verify source no longer has the spec
      const sourceExists = await storage.exists('source/test-api/metadata.json')
      expect(sourceExists).toBe(false)

      // Verify target has the spec
      const targetExists = await storage.exists('target/test-api/metadata.json')
      expect(targetExists).toBe(true)
    })

    it('should fail when moving non-existent spec', async () => {
      await expect(
        folderManager.moveSpec('non-existent' as ApiId, 'source', 'target')
      ).rejects.toThrow('not found')
    })

    it('should fail when moving to non-existent folder', async () => {
      await expect(
        folderManager.moveSpec('test-api' as ApiId, 'source', 'non-existent')
      ).rejects.toThrow()
    })

    it('should fail when spec already exists in target', async () => {
      // Create the same spec in target
      await storage.write('target/test-api/metadata.json', JSON.stringify({
        api_id: 'test-api',
      }))

      await expect(
        folderManager.moveSpec('test-api' as ApiId, 'source', 'target')
      ).rejects.toThrow('already exists')
    })
  })

  describe('findSpecFolder', () => {
    it('should find the folder containing a spec', async () => {
      await folderManager.createFolder('test-folder', { title: 'Test' })
      await storage.write('test-folder/api1/metadata.json', '{}')

      const folder = await folderManager.findSpecFolder('api1' as ApiId)

      expect(folder).toBe('test-folder')
    })

    it('should return null for non-existent spec', async () => {
      const folder = await folderManager.findSpecFolder('non-existent' as ApiId)
      expect(folder).toBeNull()
    })
  })
})

