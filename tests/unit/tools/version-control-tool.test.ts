/**
 * Version Control Tool - Unit Tests
 *
 * @description Comprehensive tests for version management operations
 */

import { VersionControlTool } from '../../../src/tools/version-control-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { VersionManager } from '../../../src/services/version-manager'
import { DiffCalculator } from '../../../src/services/diff-calculator'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/version-manager')
jest.mock('../../../src/services/diff-calculator')
jest.mock('../../../src/services/audit-logger')

describe('VersionControlTool', () => {
  let tool: VersionControlTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockVersionManager: jest.Mocked<VersionManager>
  let mockDiffCalculator: jest.Mocked<DiffCalculator>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version1 = createVersionTag('v1.0.0')
  const version2 = createVersionTag('v2.0.0')

  beforeEach(() => {
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
      deleteSpec: jest.fn(),
      specExists: jest.fn(),
    } as any

    mockVersionManager = {
      listVersions: jest.fn(),
      getApiMetadata: jest.fn(),
      createApiMetadata: jest.fn(),
      createVersionMetadata: jest.fn(),
      getVersionMetadata: jest.fn(),
      setCurrentVersion: jest.fn(),
      deleteVersion: jest.fn(),
      addVersion: jest.fn(),
    } as any

    mockDiffCalculator = {
      calculateDiff: jest.fn().mockResolvedValue({
        endpoints_added: [],
        endpoints_modified: [],
        endpoints_deleted: [],
        schemas_added: [],
        schemas_modified: [],
        schemas_deleted: [],
        breaking_changes: [],
      }),
    } as any

    mockAuditLogger = {
      logEvent: jest.fn(),
    } as any

    tool = new VersionControlTool(
      mockSpecManager,
      mockVersionManager,
      mockDiffCalculator,
      mockAuditLogger
    )
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('version_control')
      expect(description.description).toContain('version')
      expect(description.inputSchema.required).toContain('apiId')
      expect(description.inputSchema.required).toContain('operation')
    })
  })

  describe('list operation', () => {
    it('should list all versions', async () => {
      const versions = [
        { version: 'v1.0.0', created_at: '2025-01-01T00:00:00Z' },
        { version: 'v2.0.0', created_at: '2025-02-01T00:00:00Z' },
      ]
      const apiMetadata = {
        api_id: apiId,
        current_version: 'v2.0.0',
        latest_stable: 'v2.0.0',
        versions: ['v1.0.0', 'v2.0.0'],
      }

      mockVersionManager.listVersions.mockResolvedValue(versions as any)
      mockVersionManager.getApiMetadata.mockResolvedValue(apiMetadata as any)

      const result = await tool.execute({
        apiId,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(2)
      expect((result.data as any)?.versions).toEqual(versions)
      expect((result.data as any)?.currentVersion).toBe('v2.0.0')
    })

    it('should handle empty version list', async () => {
      mockVersionManager.listVersions.mockResolvedValue([])
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: null,
        latest_stable: null,
        versions: [],
      } as any)

      const result = await tool.execute({
        apiId,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(0)
    })
  })

  describe('create operation', () => {
    it('should create a new version from scratch', async () => {
      mockVersionManager.getApiMetadata.mockRejectedValue(new Error('API not found'))
      mockSpecManager.saveSpec.mockResolvedValue(undefined)
      mockVersionManager.createApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)
      mockVersionManager.createVersionMetadata.mockResolvedValue(undefined)

      const result = await tool.execute({
        apiId,
        operation: 'create',
        version: version1,
        description: 'Initial version',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.version).toBe(version1)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockVersionManager.createApiMetadata).toHaveBeenCalled()
      expect(mockVersionManager.addVersion).not.toHaveBeenCalled() // Not called for first version
      expect(mockVersionManager.createVersionMetadata).toHaveBeenCalledWith(
        apiId,
        version1,
        expect.objectContaining({
          description: 'Initial version',
          changes: expect.objectContaining({
            endpoints_added: [],
            breaking_changes: [],
          }),
        })
      )
      expect(mockAuditLogger.logEvent).toHaveBeenCalled()
    })

    it('should create a new version by copying from source', async () => {
      const sourceSpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/test': {} },
      }

      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sourceSpec } as any)
      mockSpecManager.saveSpec.mockResolvedValue(undefined)
      mockVersionManager.addVersion.mockResolvedValue({
        api_id: apiId,
        current_version: version2,
        latest_stable: version2,
        versions: [version2, version1],
      } as any)
      mockVersionManager.createVersionMetadata.mockResolvedValue(undefined)

      const result = await tool.execute({
        apiId,
        operation: 'create',
        version: version2,
        sourceVersion: version1,
        description: 'Copy of v1.0.0',
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.loadSpec).toHaveBeenCalledWith(apiId, version1)
      expect(mockSpecManager.saveSpec).toHaveBeenCalledWith(apiId, version2, sourceSpec)
      expect(mockVersionManager.addVersion).toHaveBeenCalledWith(apiId, version2, true)
      expect((result.data as any)?.sourceVersion).toBe(version1)
    })

    it('should reject duplicate version creation', async () => {
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)
      mockSpecManager.saveSpec.mockResolvedValue(undefined)
      mockVersionManager.createVersionMetadata.mockRejectedValue(
        new Error('Version already exists')
      )

      await expect(
        tool.execute({
          apiId,
          operation: 'create',
          version: version1,
        })
      ).rejects.toThrow()
    })

    it('should include llmReason in audit log', async () => {
      mockVersionManager.getApiMetadata.mockRejectedValue(new Error('API not found'))
      mockSpecManager.saveSpec.mockResolvedValue(undefined)
      mockVersionManager.createApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)
      mockVersionManager.createVersionMetadata.mockResolvedValue(undefined)

      await tool.execute({
        apiId,
        operation: 'create',
        version: version1,
        llmReason: 'User requested new version',
      })

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm_reason: 'User requested new version',
        })
      )
    })
  })

  describe('get operation', () => {
    it('should retrieve version metadata', async () => {
      const metadata = {
        version: version1,
        created_at: '2025-01-01T00:00:00Z',
        description: 'Initial version',
        changes: {
          endpoints_added: [],
          endpoints_modified: [],
          endpoints_removed: [],
          schemas_added: [],
          schemas_modified: [],
          schemas_removed: [],
          breaking_changes: [],
        },
      }

      mockVersionManager.getVersionMetadata.mockResolvedValue(metadata as any)

      const result = await tool.execute({
        apiId,
        operation: 'get',
        version: version1,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.metadata).toEqual(metadata)
      expect(mockVersionManager.getVersionMetadata).toHaveBeenCalledWith(apiId, version1)
    })
  })

  describe('compare operation', () => {
    it('should compare two versions', async () => {
      const fromSpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: { '/users': {} },
      }
      const toSpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '2.0.0' },
        paths: { '/users': {}, '/products': {} },
      }
      const changes = {
        endpoints_added: ['/products'],
        endpoints_modified: [],
        endpoints_deleted: [],
        schemas_added: [],
        schemas_modified: [],
        schemas_deleted: [],
        breaking_changes: [],
      }

      mockSpecManager.loadSpec
        .mockResolvedValueOnce({ version: '3.0', spec: fromSpec } as any)
        .mockResolvedValueOnce({ version: '3.0', spec: toSpec } as any)
      ;(mockDiffCalculator.calculateDiff as jest.Mock).mockResolvedValueOnce(changes)

      const result = await tool.execute({
        apiId,
        operation: 'compare',
        fromVersion: version1,
        toVersion: version2,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.changes).toEqual(changes)
      expect((result.data as any)?.hasBreakingChanges).toBe(false)
      expect(mockDiffCalculator.calculateDiff).toHaveBeenCalledWith(
        { version: '3.0', spec: fromSpec },
        { version: '3.0', spec: toSpec }
      )
    })

    it('should detect breaking changes', async () => {
      const changes = {
        endpoints_added: [],
        endpoints_modified: [],
        endpoints_deleted: ['/users'],
        schemas_added: [],
        schemas_modified: [],
        schemas_deleted: [],
        breaking_changes: ['Removed endpoint /users'],
      }

      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: {} } as any)
      ;(mockDiffCalculator.calculateDiff as jest.Mock).mockResolvedValueOnce(changes)

      const result = await tool.execute({
        apiId,
        operation: 'compare',
        fromVersion: version1,
        toVersion: version2,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.hasBreakingChanges).toBe(true)
      expect((result.data as any)?.changes.breaking_changes).toHaveLength(1)
    })
  })

  describe('set_current operation', () => {
    it('should set current version', async () => {
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1, version2],
      } as any)
      mockVersionManager.setCurrentVersion.mockResolvedValue({
        api_id: apiId,
        current_version: version2,
        latest_stable: version1,
        versions: [version1, version2],
      } as any)

      const result = await tool.execute({
        apiId,
        operation: 'set_current',
        version: version2,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.currentVersion).toBe(version2)
      expect(mockVersionManager.setCurrentVersion).toHaveBeenCalledWith(apiId, version2)
      expect(mockAuditLogger.logEvent).toHaveBeenCalled()
    })

    it('should reject setting non-existent version as current', async () => {
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)

      await expect(
        tool.execute({
          apiId,
          operation: 'set_current',
          version: version2,
        })
      ).rejects.toThrow('does not exist')
    })
  })

  describe('delete operation', () => {
    it('should delete a version', async () => {
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version2,
        latest_stable: version2,
        versions: [version1, version2],
      } as any)
      mockSpecManager.deleteSpec.mockResolvedValue(undefined)
      mockVersionManager.deleteVersion.mockResolvedValue({
        api_id: apiId,
        current_version: version2,
        latest_stable: version2,
        versions: [version2],
      } as any)

      const result = await tool.execute({
        apiId,
        operation: 'delete',
        version: version1,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.deletedVersion).toBe(version1)
      expect(mockSpecManager.deleteSpec).toHaveBeenCalledWith(apiId, version1)
      expect(mockVersionManager.deleteVersion).toHaveBeenCalledWith(apiId, version1)
      expect(mockAuditLogger.logEvent).toHaveBeenCalled()
    })

    it('should reject deleting current version', async () => {
      mockVersionManager.getApiMetadata.mockResolvedValue({
        api_id: apiId,
        current_version: version1,
        latest_stable: version1,
        versions: [version1],
      } as any)

      await expect(
        tool.execute({
          apiId,
          operation: 'delete',
          version: version1,
        })
      ).rejects.toThrow('Cannot delete current version')
    })
  })

  describe('validation', () => {
    it('should validate apiId format', async () => {
      await expect(
        tool.execute({
          apiId: '',
          operation: 'list',
        } as any)
      ).rejects.toThrow()
    })

    it('should validate version format', async () => {
      await expect(
        tool.execute({
          apiId,
          operation: 'create',
          version: 'invalid',
        } as any)
      ).rejects.toThrow()
    })

    it('should require version for create operation', async () => {
      await expect(
        tool.execute({
          apiId,
          operation: 'create',
        } as any)
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle spec manager failures', async () => {
      mockVersionManager.getApiMetadata.mockRejectedValue(new Error('API not found'))
      mockSpecManager.saveSpec.mockRejectedValue(new Error('Storage error'))

      await expect(
        tool.execute({
          apiId,
          operation: 'create',
          version: version1,
        })
      ).rejects.toThrow()
    })

    it('should handle version manager failures', async () => {
      mockVersionManager.listVersions.mockRejectedValue(new Error('Database error'))

      await expect(
        tool.execute({
          apiId,
          operation: 'list',
        })
      ).rejects.toThrow()
    })
  })
})

