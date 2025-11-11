/**
 * Tests for SchemaManageTool
 */

import { SchemaManageTool } from '../../../src/tools/schema-manage-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

// Mock dependencies
jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('SchemaManageTool', () => {
  let tool: SchemaManageTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const sampleSpec = {
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
            email: { type: 'string', format: 'email' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
          },
        },
      },
    },
  }

  beforeEach(() => {
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
    } as any

    mockAuditLogger = {
      logEvent: jest.fn(),
    } as any

    tool = new SchemaManageTool(mockSpecManager, mockAuditLogger)
  })

  describe('list operation', () => {
    it('should list all schemas', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(2)
      expect((result.data as any).schemas).toEqual(['User', 'Product'])
      expect((result.data as any).definitions.User).toBeDefined()
      expect((result.data as any).definitions.Product).toBeDefined()
    })

    it('should handle empty schemas', async () => {
      const emptySpec = {
        ...sampleSpec,
        components: { schemas: {} },
      }
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: emptySpec,
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(0)
      expect((result.data as any).schemas).toEqual([])
    })

    it('should handle missing components section', async () => {
      const noComponentsSpec = {
        ...sampleSpec,
        components: undefined,
      }
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: noComponentsSpec,
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(0)
    })
  })

  describe('add operation', () => {
    it('should add a new schema', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const newSchema = {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
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
      expect((result.data as any).schemaName).toBe('Post')
      expect((result.data as any).schema).toEqual(newSchema)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'schema_add',
          details: expect.objectContaining({
            schemaName: 'Post',
          }),
        })
      )
    })

    it('should create components.schemas if missing', async () => {
      const specWithoutComponents = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: specWithoutComponents,
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'NewSchema',
        schema: { type: 'object' },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })

    it('should throw error if schema already exists', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

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

    it('should throw error if schemaName is missing', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          schema: { type: 'object' },
        } as any)
      ).rejects.toThrow('schemaName is required')
    })

    it('should throw error if schema is missing', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: 'NewSchema',
        } as any)
      ).rejects.toThrow('schema is required')
    })

    it('should include llmReason in audit log', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Comment',
        schema: { type: 'object' },
        llmReason: 'Adding comment schema for blog posts',
      })

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm_reason: 'Adding comment schema for blog posts',
        })
      )
    })
  })

  describe('update operation', () => {
    it('should update an existing schema', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const updates = {
        description: 'Updated user schema',
        properties: {
          ...sampleSpec.components.schemas.User.properties,
          age: { type: 'number' },
        },
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: updates,
      })

      expect(result.success).toBe(true)
      expect((result.data as any).schemaName).toBe('User')
      expect((result.data as any).updated.description).toBe('Updated user schema')
      expect((result.data as any).updated.properties.age).toBeDefined()
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'schema_update',
        })
      )
    })

    it('should merge updates with existing schema', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          description: 'User account',
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.type).toBe('object')
      expect(updated.required).toEqual(['id', 'name'])
      expect(updated.description).toBe('User account')
    })

    it('should throw error if schema does not exist', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

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

    it('should throw error if schemaName is missing', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'update',
          schema: { type: 'object' },
        } as any)
      ).rejects.toThrow('schemaName is required')
    })

    it('should throw error if schema is missing', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'update',
          schemaName: 'User',
        } as any)
      ).rejects.toThrow('schema is required')
    })
  })

  describe('delete operation', () => {
    it('should delete an existing schema', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        schemaName: 'Product',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).schemaName).toBe('Product')
      expect((result.data as any).deleted).toEqual(sampleSpec.components.schemas.Product)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'schema_delete',
        })
      )
    })

    it('should throw error if schema does not exist', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'delete',
          schemaName: 'NonExistent',
        })
      ).rejects.toThrow('not found')
    })

    it('should throw error if schemaName is missing', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'delete',
        } as any)
      ).rejects.toThrow('schemaName is required')
    })
  })

  describe('error handling', () => {
    it('should propagate spec load errors', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Load failed'))

      await expect(tool.execute({
        apiId,
        version,
        operation: 'list',
      })).rejects.toThrow()
    })

    it('should propagate spec save errors', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)
      mockSpecManager.saveSpec.mockRejectedValue(new Error('Save failed'))

      await expect(tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'NewSchema',
        schema: { type: 'object' },
      })).rejects.toThrow()
    })
  })

  describe('validation', () => {
    it('should throw error for invalid API ID', async () => {
      await expect(
        tool.execute({
          apiId: 'invalid id',
          version,
          operation: 'list',
        } as any)
      ).rejects.toThrow()
    })

    it('should throw error for invalid version', async () => {
      await expect(
        tool.execute({
          apiId,
          version: 'invalid',
          operation: 'list',
        } as any)
      ).rejects.toThrow()
    })

    it('should throw error for unknown operation', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'unknown' as any,
        })
      ).rejects.toThrow('Validation failed')
    })
  })

  describe('describe', () => {
    it('should return correct tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('schema_manage')
      expect(description.description).toContain('schema')
      expect(description.inputSchema).toBeDefined()
    })
  })
})

