/**
 * Integration Tests - Schema Management Workflow
 *
 * @description Tests end-to-end workflow for managing schemas
 */

import { FileSystemStorage } from '../../src/storage/file-system-storage'
import { SpecManager } from '../../src/services/spec-manager'
import { AuditLogger } from '../../src/services/audit-logger'
import { SchemaManageTool } from '../../src/tools/schema-manage-tool'
import { createApiId, createVersionTag } from '../../src/types/openapi'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Integration: Schema Management Workflow', () => {
  let tempDir: string
  let storage: FileSystemStorage
  let specManager: SpecManager
  let auditLogger: AuditLogger
  let tool: SchemaManageTool
  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const initialSpec = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'schema-manage-test-'))
    storage = new FileSystemStorage({ basePath: tempDir })
    specManager = new SpecManager(storage)
    auditLogger = new AuditLogger(storage)
    tool = new SchemaManageTool(specManager, auditLogger)

    await specManager.saveSpec(apiId, version, initialSpec)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('List operations', () => {
    it('should list existing schemas', async () => {
      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(1)
      expect((result.data as any).schemas).toEqual(['User'])
    })

    it('should handle empty schema list', async () => {
      const emptySpec = {
        ...initialSpec,
        components: { schemas: {} },
      }
      await specManager.saveSpec(apiId, version, emptySpec)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(0)
    })
  })

  describe('Add operations', () => {
    it('should add a new schema and persist it', async () => {
      const newSchema = {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
        },
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Post',
        schema: newSchema,
      })

      expect(result.success).toBe(true)

      // Verify schema persisted
      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).components.schemas.Post).toEqual(newSchema)
      expect((spec as any).components.schemas.User).toBeDefined() // Original preserved
    })

    it('should add multiple schemas', async () => {
      await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Product',
        schema: { type: 'object', properties: { name: { type: 'string' } } },
      })

      await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Order',
        schema: { type: 'object', properties: { total: { type: 'number' } } },
      })

      const listResult = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect((listResult.data as any).count).toBe(3)
      expect((listResult.data as any).schemas).toContain('User')
      expect((listResult.data as any).schemas).toContain('Product')
      expect((listResult.data as any).schemas).toContain('Order')
    })

    it('should create components.schemas if missing', async () => {
      const specWithoutComponents = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      await specManager.saveSpec(apiId, version, specWithoutComponents)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'NewSchema',
        schema: { type: 'object' },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).components).toBeDefined()
      expect((spec as any).components.schemas).toBeDefined()
      expect((spec as any).components.schemas.NewSchema).toBeDefined()
    })
  })

  describe('Update operations', () => {
    it('should update existing schema', async () => {
      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          description: 'User account schema',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            age: { type: 'number' },
          },
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      const userSchema = (spec as any).components.schemas.User
      expect(userSchema.description).toBe('User account schema')
      expect(userSchema.properties.email).toBeDefined()
      expect(userSchema.properties.age).toBeDefined()
    })

    it('should merge updates with existing schema', async () => {
      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          description: 'Updated description',
        },
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      const userSchema = (spec as any).components.schemas.User
      expect(userSchema.type).toBe('object')
      expect(userSchema.required).toEqual(['id', 'name'])
      expect(userSchema.description).toBe('Updated description')
    })
  })

  describe('Delete operations', () => {
    it('should delete a schema', async () => {
      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        schemaName: 'User',
      })

      expect(result.success).toBe(true)

      const reloadedSpec = await specManager.loadSpec(apiId, version)
      const spec = 'spec' in reloadedSpec ? reloadedSpec.spec : reloadedSpec
      expect((spec as any).components.schemas.User).toBeUndefined()
    })

    it('should return deleted schema in response', async () => {
      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        schemaName: 'User',
      })

      expect((result.data as any).deleted).toEqual(initialSpec.components.schemas.User)
    })
  })

  describe('Complex workflows', () => {
    it('should handle add → update → delete sequence', async () => {
      // Add
      await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Comment',
        schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
        },
      })

      // Update
      await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'Comment',
        schema: {
          properties: {
            text: { type: 'string' },
            author: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      })

      // Verify update
      let spec = await specManager.loadSpec(apiId, version)
      let actualSpec = 'spec' in spec ? spec.spec : spec
      expect((actualSpec as any).components.schemas.Comment.properties.author).toBeDefined()

      // Delete
      await tool.execute({
        apiId,
        version,
        operation: 'delete',
        schemaName: 'Comment',
      })

      // Verify deletion
      spec = await specManager.loadSpec(apiId, version)
      actualSpec = 'spec' in spec ? spec.spec : spec
      expect((actualSpec as any).components.schemas.Comment).toBeUndefined()
    })

    it('should handle multiple concurrent schema additions', async () => {
      const schemas = [
        { name: 'Product', schema: { type: 'object', properties: { name: { type: 'string' } } } },
        { name: 'Category', schema: { type: 'object', properties: { title: { type: 'string' } } } },
        { name: 'Tag', schema: { type: 'object', properties: { label: { type: 'string' } } } },
      ]

      for (const { name, schema } of schemas) {
        await tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: name,
          schema,
        })
      }

      const listResult = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect((listResult.data as any).count).toBe(4) // User + 3 new schemas
    })
  })

  describe('Audit logging', () => {
    it('should log add operation', async () => {
      await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Post',
        schema: { type: 'object' },
        llmReason: 'Adding post schema for blog',
      })

      const auditLog = await auditLogger.getAuditLog(apiId)
      expect(auditLog.length).toBeGreaterThan(0)
      const addEvent = auditLog.find(e => e.event === 'schema_add')
      expect(addEvent).toBeDefined()
      expect(addEvent?.llm_reason).toBe('Adding post schema for blog')
    })

    it('should log update operation', async () => {
      await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: { description: 'Updated' },
      })

      const auditLog = await auditLogger.getAuditLog(apiId)
      const updateEvent = auditLog.find(e => e.event === 'schema_update')
      expect(updateEvent).toBeDefined()
      expect(updateEvent?.details).toHaveProperty('original')
      expect(updateEvent?.details).toHaveProperty('updated')
    })

    it('should log delete operation', async () => {
      await tool.execute({
        apiId,
        version,
        operation: 'delete',
        schemaName: 'User',
      })

      const auditLog = await auditLogger.getAuditLog(apiId)
      const deleteEvent = auditLog.find(e => e.event === 'schema_delete')
      expect(deleteEvent).toBeDefined()
      expect(deleteEvent?.details).toHaveProperty('deletedSchema')
    })
  })

  describe('Error scenarios', () => {
    it('should prevent adding duplicate schema', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: 'User', // Already exists
          schema: { type: 'object' },
        })
      ).rejects.toThrow('already exists')
    })

    it('should prevent updating non-existent schema', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'update',
          schemaName: 'NonExistent',
          schema: { type: 'object' },
        })
      ).rejects.toThrow('not found')
    })

    it('should prevent deleting non-existent schema', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'delete',
          schemaName: 'NonExistent',
        })
      ).rejects.toThrow('not found')
    })
  })
})

