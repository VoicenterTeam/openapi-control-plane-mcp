/**
 * Tests for VersionManager
 */

import { VersionManager } from '../../../src/services/version-manager'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import { createApiId, createVersionTag } from '../../../src/types/openapi'
import type { ApiMetadata, VersionMetadata } from '../../../src/types/metadata'

// Mock the storage
jest.mock('../../../src/storage/file-system-storage')

describe('VersionManager', () => {
  let versionManager: VersionManager
  let mockStorage: jest.Mocked<FileSystemStorage>

  const apiId = createApiId('test-api')
  const version1 = createVersionTag('v1.0.0')
  const version2 = createVersionTag('v1.1.0')

  const sampleMetadata: ApiMetadata = {
    api_id: apiId,
    name: 'Test API',
    created_at: '2024-01-15T10:00:00.000Z',
    current_version: version1,
    versions: [version1],
    latest_stable: version1,
    owner: 'team@example.com',
  }

  beforeEach(() => {
    mockStorage = new FileSystemStorage({ basePath: '/data' }) as jest.Mocked<FileSystemStorage>
    versionManager = new VersionManager(mockStorage)
  })

  describe('createApiMetadata', () => {
    it('should create new API metadata', async () => {
      mockStorage.exists.mockResolvedValue(false)
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.createApiMetadata(
        apiId,
        'Test API',
        'team@example.com',
        version1
      )

      expect(result.api_id).toBe(apiId)
      expect(result.name).toBe('Test API')
      expect(result.owner).toBe('team@example.com')
      expect(result.versions).toEqual([version1])
      expect(result.current_version).toBe(version1)
      expect(result.latest_stable).toBe(version1)
      expect(mockStorage.write).toHaveBeenCalledWith(
        'test-api/metadata.json',
        expect.stringContaining('"name": "Test API"')
      )
    })

    it('should throw error if metadata already exists', async () => {
      mockStorage.exists.mockResolvedValue(true)

      await expect(
        versionManager.createApiMetadata(apiId, 'Test API', 'team@example.com', version1)
      ).rejects.toThrow()
    })
  })

  describe('getApiMetadata', () => {
    it('should retrieve API metadata', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))

      const result = await versionManager.getApiMetadata(apiId)

      expect(result).toEqual(sampleMetadata)
      expect(mockStorage.read).toHaveBeenCalledWith('test-api/metadata.json')
    })

    it('should throw error if metadata not found', async () => {
      mockStorage.read.mockRejectedValue(new Error('File not found'))

      await expect(versionManager.getApiMetadata(apiId)).rejects.toThrow()
    })
  })

  describe('updateApiMetadata', () => {
    it('should update API metadata', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.updateApiMetadata(apiId, {
        name: 'Updated API Name',
        description: 'New description',
      })

      expect(result.name).toBe('Updated API Name')
      expect(result.description).toBe('New description')
      expect(mockStorage.write).toHaveBeenCalled()
    })

    it('should preserve immutable fields', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.updateApiMetadata(apiId, {
        owner: 'new-team@example.com',
      })

      expect(result.api_id).toBe(sampleMetadata.api_id)
      expect(result.created_at).toBe(sampleMetadata.created_at)
    })
  })

  describe('addVersion', () => {
    it('should add new version to API', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.addVersion(apiId, version2, true)

      expect(result.versions).toEqual([version2, version1])
      expect(result.current_version).toBe(version2)
    })

    it('should add version without setting as current', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.addVersion(apiId, version2, false)

      expect(result.versions).toEqual([version2, version1])
      expect(result.current_version).toBe(version1) // Unchanged
    })

    it('should throw error if version already exists', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))

      await expect(versionManager.addVersion(apiId, version1, true)).rejects.toThrow()
    })
  })

  describe('listVersions', () => {
    it('should return all versions', async () => {
      const metadataWithMultipleVersions = {
        ...sampleMetadata,
        versions: [version2, version1],
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(metadataWithMultipleVersions))

      const result = await versionManager.listVersions(apiId)

      expect(result).toEqual([version2, version1])
    })
  })

  describe('setCurrentVersion', () => {
    it('should update current version', async () => {
      const metadataWith2Versions = {
        ...sampleMetadata,
        versions: [version2, version1],
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(metadataWith2Versions))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.setCurrentVersion(apiId, version2)

      expect(result.current_version).toBe(version2)
    })

    it('should throw error if version does not exist', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))

      await expect(
        versionManager.setCurrentVersion(apiId, createVersionTag('v99.0.0'))
      ).rejects.toThrow()
    })
  })

  describe('setLatestStable', () => {
    it('should update latest stable version', async () => {
      const metadataWith2Versions = {
        ...sampleMetadata,
        versions: [version2, version1],
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(metadataWith2Versions))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.setLatestStable(apiId, version2)

      expect(result.latest_stable).toBe(version2)
    })

    it('should throw error if version does not exist', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))

      await expect(
        versionManager.setLatestStable(apiId, createVersionTag('v99.0.0'))
      ).rejects.toThrow()
    })
  })

  describe('createVersionMetadata', () => {
    it('should create version metadata', async () => {
      mockStorage.write.mockResolvedValue(undefined)

      const versionMetadata: VersionMetadata = {
        version: version1,
        created_at: '2024-01-15T10:00:00.000Z',
        created_by: 'user@example.com',
        parent_version: null,
        description: 'Initial version',
        changes: {
          endpoints_added: [],
          endpoints_modified: [],
          endpoints_deleted: [],
          schemas_added: [],
          schemas_modified: [],
          schemas_deleted: [],
          breaking_changes: [],
        },
        validation: {
          spectral_errors: 0,
          spectral_warnings: 0,
          openapi_valid: true,
        },
        stats: {
          endpoint_count: 0,
          schema_count: 0,
          file_size_bytes: 1024,
        },
      }

      await versionManager.createVersionMetadata(apiId, version1, versionMetadata)

      expect(mockStorage.write).toHaveBeenCalledWith(
        'test-api/v1.0.0/metadata.json',
        expect.stringContaining('"version": "v1.0.0"')
      )
    })
  })

  describe('getVersionMetadata', () => {
    it('should retrieve version metadata', async () => {
      const versionMetadata: VersionMetadata = {
        version: version1,
        created_at: '2024-01-15T10:00:00.000Z',
        created_by: 'user@example.com',
        parent_version: null,
        description: 'Initial version',
        changes: {
          endpoints_added: [],
          endpoints_modified: [],
          endpoints_deleted: [],
          schemas_added: [],
          schemas_modified: [],
          schemas_deleted: [],
          breaking_changes: [],
        },
        validation: {
          spectral_errors: 0,
          spectral_warnings: 0,
          openapi_valid: true,
        },
        stats: {
          endpoint_count: 0,
          schema_count: 0,
          file_size_bytes: 1024,
        },
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(versionMetadata))

      const result = await versionManager.getVersionMetadata(apiId, version1)

      expect(result).toEqual(versionMetadata)
      expect(mockStorage.read).toHaveBeenCalledWith('test-api/v1.0.0/metadata.json')
    })
  })

  describe('deleteVersion', () => {
    it('should delete non-current, non-stable version', async () => {
      const metadataWith3Versions = {
        ...sampleMetadata,
        versions: [createVersionTag('v1.2.0'), version2, version1],
        current_version: version1,
        latest_stable: version1,
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(metadataWith3Versions))
      mockStorage.write.mockResolvedValue(undefined)

      const result = await versionManager.deleteVersion(apiId, version2)

      expect(result.versions).not.toContain(version2)
      expect(result.versions).toContain(version1)
    })

    it('should throw error when deleting current version', async () => {
      mockStorage.read.mockResolvedValue(JSON.stringify(sampleMetadata))

      await expect(versionManager.deleteVersion(apiId, version1)).rejects.toThrow()
    })

    it('should throw error when deleting latest stable version', async () => {
      const metadataWith2Versions = {
        ...sampleMetadata,
        versions: [version2, version1],
        current_version: version2,
        latest_stable: version1,
      }
      mockStorage.read.mockResolvedValue(JSON.stringify(metadataWith2Versions))

      await expect(versionManager.deleteVersion(apiId, version1)).rejects.toThrow()
    })
  })
})

