/**
 * Integration Tests - Metadata Update Workflow
 *
 * @description Tests end-to-end workflow for updating API metadata
 */

import { FileSystemStorage } from '../../src/storage/file-system-storage'
import { SpecManager } from '../../src/services/spec-manager'
import { AuditLogger } from '../../src/services/audit-logger'
import { MetadataUpdateTool } from '../../src/tools/metadata-update-tool'
import { createApiId, createVersionTag } from '../../src/types/openapi'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Integration: Metadata Update Workflow', () => {
  let tempDir: string
  let storage: FileSystemStorage
  let specManager: SpecManager
  let auditLogger: AuditLogger
  let tool: MetadataUpdateTool
  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const initialSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'Original description',
      contact: {
        name: 'Test Team',
        email: 'test@example.com',
      },
    },
    paths: {},
  }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metadata-update-test-'))
    storage = new FileSystemStorage({ basePath: tempDir })
    specManager = new SpecManager(storage)
    auditLogger = new AuditLogger(storage)
    tool = new MetadataUpdateTool(specManager, auditLogger)

    // Create initial spec
    await specManager.saveSpec(apiId, version, initialSpec)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('Single field updates', () => {
    it('should update title and persist changes', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Updated API Title',
        },
      })

      expect(result.success).toBe(true)

      // Verify changes persisted
      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.title).toBe('Updated API Title')
    })

    it('should update description', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          description: 'Completely new description with details',
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.description).toBe('Completely new description with details')
    })

    it('should update API version string', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          version: '2.0.0',
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.version).toBe('2.0.0')
    })
  })

  describe('Contact information updates', () => {
    it('should update contact name', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          contact: {
            name: 'New Contact Name',
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.contact.name).toBe('New Contact Name')
      expect((spec as any).info.contact.email).toBe('test@example.com') // Preserved
    })

    it('should update complete contact info', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          contact: {
            name: 'API Support',
            email: 'support@newdomain.com',
            url: 'https://support.newdomain.com',
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.contact).toEqual({
        name: 'API Support',
        email: 'support@newdomain.com',
        url: 'https://support.newdomain.com',
      })
    })
  })

  describe('License updates', () => {
    it('should add license when none exists', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.license).toEqual({
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      })
    })
  })

  describe('Custom x- extensions', () => {
    it('should add custom extensions', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            logo: 'https://example.com/logo.png',
            category: 'finance',
            team: 'platform',
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info['x-logo']).toBe('https://example.com/logo.png')
      expect((spec as any).info['x-category']).toBe('finance')
      expect((spec as any).info['x-team']).toBe('platform')
    })

    it('should handle extensions already prefixed with x-', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            'x-internal': true,
            'x-deprecated': false,
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info['x-internal']).toBe(true)
      expect((spec as any).info['x-deprecated']).toBe(false)
    })
  })

  describe('Multiple updates', () => {
    it('should update multiple fields atomically', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Completely New Title',
          description: 'Completely new description',
          version: '3.0.0',
          contact: {
            name: 'New Team',
            email: 'newteam@example.com',
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.title).toBe('Completely New Title')
      expect((spec as any).info.description).toBe('Completely new description')
      expect((spec as any).info.version).toBe('3.0.0')
      expect((spec as any).info.contact.name).toBe('New Team')
      expect((spec as any).info.contact.email).toBe('newteam@example.com')
    })
  })

  describe('Audit logging', () => {
    it('should create audit log entry', async () => {
      await tool.execute({
        apiId,
        version,
        updates: {
          title: 'New Title',
        },
        llmReason: 'User requested clearer title',
      })

      const auditLog = await auditLogger.getAuditLog(apiId)
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0].event).toBe('metadata_update')
      expect(auditLog[0].llm_reason).toBe('User requested clearer title')
      expect(auditLog[0].details).toHaveProperty('original')
      expect(auditLog[0].details).toHaveProperty('updated')
    })

    it('should track multiple updates in audit log', async () => {
      await tool.execute({
        apiId,
        version,
        updates: { title: 'Title 1' },
      })

      await tool.execute({
        apiId,
        version,
        updates: { description: 'Description 2' },
      })

      await tool.execute({
        apiId,
        version,
        updates: { version: '2.0.0' },
      })

      const auditLog = await auditLogger.getAuditLog(apiId)
      expect(auditLog).toHaveLength(3)
      expect(auditLog[0].event).toBe('metadata_update')
      expect(auditLog[1].event).toBe('metadata_update')
      expect(auditLog[2].event).toBe('metadata_update')
    })
  })

  describe('Sequential updates', () => {
    it('should handle multiple sequential updates correctly', async () => {
      // Update 1
      await tool.execute({
        apiId,
        version,
        updates: { title: 'Title v1' },
      })

      // Update 2
      await tool.execute({
        apiId,
        version,
        updates: { description: 'Description v2' },
      })

      // Update 3
      await tool.execute({
        apiId,
        version,
        updates: { 
          contact: {
            name: 'Final Contact',
          },
        },
      })

      // Verify final state
      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).info.title).toBe('Title v1')
      expect((spec as any).info.description).toBe('Description v2')
      expect((spec as any).info.contact.name).toBe('Final Contact')
    })
  })

  describe('Change summarization', () => {
    it('should provide accurate change summary', async () => {
      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Changed Title',
          description: 'Changed Description',
        },
      })

      expect(result.success).toBe(true)
      const changes = (result.data as any).changes
      expect(changes.title).toEqual({
        from: 'Test API',
        to: 'Changed Title',
      })
      expect(changes.description).toEqual({
        from: 'Original description',
        to: 'Changed Description',
      })
    })
  })
})

