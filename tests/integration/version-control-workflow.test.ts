/**
 * Version Control Tool - Integration Tests
 *
 * @description End-to-end tests for version management workflows
 */

import { VersionControlTool } from '../../src/tools/version-control-tool'
import { SpecManager } from '../../src/services/spec-manager'
import { VersionManager } from '../../src/services/version-manager'
import { DiffCalculator } from '../../src/services/diff-calculator'
import { AuditLogger } from '../../src/services/audit-logger'
import { FileSystemStorage } from '../../src/storage/file-system-storage'
import { createApiId, createVersionTag } from '../../src/types/openapi'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('VersionControlTool - Integration', () => {
  const testDataDir = path.join(__dirname, '../test-data-version')
  let storage: FileSystemStorage
  let specManager: SpecManager
  let versionManager: VersionManager
  let diffCalculator: DiffCalculator
  let auditLogger: AuditLogger
  let tool: VersionControlTool

  const apiId = createApiId('myapi')
  const v1 = createVersionTag('v1.0.0')
  const v2 = createVersionTag('v2.0.0')
  const v3 = createVersionTag('v3.0.0')

  beforeAll(async () => {
    // Clean up test data directory
    await fs.rm(testDataDir, { recursive: true, force: true })
    await fs.mkdir(testDataDir, { recursive: true })

    // Initialize storage and services
    storage = new FileSystemStorage({ basePath: testDataDir })
    specManager = new SpecManager(storage)
    versionManager = new VersionManager(storage)
    diffCalculator = new DiffCalculator()
    auditLogger = new AuditLogger(storage)
    tool = new VersionControlTool(specManager, versionManager, diffCalculator, auditLogger)
  })

  afterAll(async () => {
    // Cleanup
    await fs.rm(testDataDir, { recursive: true, force: true })
  })

  describe('Complete version lifecycle', () => {
    it('should create initial version from scratch', async () => {
      const result = await tool.execute({
        apiId,
        operation: 'create',
        version: v1,
        description: 'Initial release',
        llmReason: 'First version of the API',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.version).toBe(v1)

      // Verify spec was created
      const spec = await specManager.loadSpec(apiId, v1)
      expect(spec).toBeDefined()
      expect((spec as any).info?.title).toContain('myapi')
    })

    it('should list all versions', async () => {
      const result = await tool.execute({
        apiId,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBeGreaterThanOrEqual(1)
      const versions = (result.data as any)?.versions || []
      expect(versions.some((v: any) => v.version === v1)).toBe(true)
    })

    it('should get version details', async () => {
      const result = await tool.execute({
        apiId,
        operation: 'get',
        version: v1,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.metadata?.version).toBe(v1)
      expect((result.data as any)?.metadata?.description).toBe('Initial release')
    })

    it('should create second version by copying from first', async () => {
      const result = await tool.execute({
        apiId,
        operation: 'create',
        version: v2,
        sourceVersion: v1,
        description: 'Second release with improvements',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.sourceVersion).toBe(v1)

      // Verify it was copied
      const spec = await specManager.loadSpec(apiId, v2)
      expect((spec as any).info?.title).toContain('myapi')
    })

    it('should set current version', async () => {
      const result = await tool.execute({
        apiId,
        operation: 'set_current',
        version: v2,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.currentVersion).toBe(v2)

      // Verify via list
      const listResult = await tool.execute({
        apiId,
        operation: 'list',
      })
      expect((listResult.data as any)?.currentVersion).toBe(v2)
    })

    it('should compare two versions', async () => {
      // First, modify v2 to add an endpoint
      const v2Spec = await specManager.loadSpec(apiId, v2)
      ;(v2Spec as any).paths = {
        ...(v2Spec as any).paths,
        '/users': {
          get: {
            summary: 'List users',
            responses: {
              '200': { description: 'Success' },
            },
          },
        },
      }
      await specManager.saveSpec(apiId, v2, v2Spec)

      // Now compare
      const result = await tool.execute({
        apiId,
        operation: 'compare',
        fromVersion: v1,
        toVersion: v2,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.fromVersion).toBe(v1)
      expect((result.data as any)?.toVersion).toBe(v2)
      expect((result.data as any)?.changes).toBeDefined()
    })

    it('should delete a version', async () => {
      // Create v3 first
      await tool.execute({
        apiId,
        operation: 'create',
        version: v3,
        description: 'Third release',
      })

      // Delete v3
      const result = await tool.execute({
        apiId,
        operation: 'delete',
        version: v3,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.deletedVersion).toBe(v3)

      // Verify it's gone
      await expect(specManager.loadSpec(apiId, v3)).rejects.toThrow()
    })

    it('should reject deleting current version', async () => {
      await expect(
        tool.execute({
          apiId,
          operation: 'delete',
          version: v2, // current version
        })
      ).rejects.toThrow()
    })
  })

  describe('Multi-API version management', () => {
    const api2Id = createApiId('another-api')

    it('should manage versions for multiple APIs independently', async () => {
      // Create first version for api2
      await tool.execute({
        apiId: api2Id,
        operation: 'create',
        version: v1,
        description: 'API 2 initial version',
      })

      // List versions for original API
      const api1Versions = await tool.execute({
        apiId,
        operation: 'list',
      })

      // List versions for API 2
      const api2Versions = await tool.execute({
        apiId: api2Id,
        operation: 'list',
      })

      // Should be independent
      expect((api1Versions.data as any)?.count).toBeGreaterThanOrEqual(2)
      expect((api2Versions.data as any)?.count).toBe(1)
    })
  })

  describe('Error scenarios', () => {
    it('should handle non-existent API gracefully', async () => {
      const nonExistentApi = createApiId('does-not-exist')

      await expect(
        tool.execute({
          apiId: nonExistentApi,
          operation: 'get',
          version: v1,
        })
      ).rejects.toThrow()
    })

    it('should handle non-existent version gracefully', async () => {
      const nonExistentVersion = createVersionTag('v99.99.99')

      await expect(
        tool.execute({
          apiId,
          operation: 'get',
          version: nonExistentVersion,
        })
      ).rejects.toThrow()
    })

    it('should validate version format', async () => {
      await expect(
        tool.execute({
          apiId,
          operation: 'create',
          version: 'invalid-version',
        } as any)
      ).rejects.toThrow()
    })
  })
})

