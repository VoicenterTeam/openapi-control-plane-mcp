/**
 * Edge Case Tests - Schema Management Tool
 *
 * @description Tests edge cases, error scenarios, and boundary conditions
 */

import { SchemaManageTool } from '../../../src/tools/schema-manage-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('SchemaManageTool - Edge Cases', () => {
  let tool: SchemaManageTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const baseSpec = {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: { id: { type: 'string' } },
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

  describe('Complex schema structures', () => {
    it('should handle deeply nested schemas', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const deepSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'object',
                    properties: {
                      data: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'DeepSchema',
        schema: deepSchema,
      })

      expect(result.success).toBe(true)
    })

    it('should handle schemas with allOf', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'ExtendedUser',
        schema: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
          ],
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle schemas with anyOf', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'FlexibleType',
        schema: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
          ],
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle schemas with oneOf', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Pet',
        schema: {
          oneOf: [
            { $ref: '#/components/schemas/Cat' },
            { $ref: '#/components/schemas/Dog' },
          ],
          discriminator: {
            propertyName: 'petType',
          },
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle array schemas with items', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'UserList',
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/User',
          },
          minItems: 1,
          maxItems: 100,
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle schemas with enum values', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Status',
        schema: {
          type: 'string',
          enum: ['active', 'inactive', 'pending', 'deleted'],
        },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Schema name edge cases', () => {
    it('should handle schema names with numbers', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'User2024',
        schema: { type: 'object' },
      })

      expect(result.success).toBe(true)
    })

    it('should handle schema names with underscores', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'User_Profile',
        schema: { type: 'object' },
      })

      expect(result.success).toBe(true)
    })

    it('should handle PascalCase schema names', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'UserProfileData',
        schema: { type: 'object' },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Schema validation patterns', () => {
    it('should handle string patterns (regex)', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Email',
        schema: {
          type: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle number constraints', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Age',
        schema: {
          type: 'number',
          minimum: 0,
          maximum: 150,
          multipleOf: 1,
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle string length constraints', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Username',
        schema: {
          type: 'string',
          minLength: 3,
          maxLength: 20,
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle format specifications', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const formats = ['date-time', 'date', 'time', 'email', 'uri', 'uuid']

      for (const format of formats) {
        const result = await tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: `Format_${format}`,
          schema: {
            type: 'string',
            format,
          },
        })
        expect(result.success).toBe(true)
        mockSpecManager.loadSpec.mockResolvedValue({
          version: '3.0',
          spec: JSON.parse(JSON.stringify(baseSpec)),
        } as any)
      }
    })
  })

  describe('Large schema operations', () => {
    it('should handle schema with many properties', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const properties: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        properties[`field${i}`] = { type: 'string' }
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'LargeSchema',
        schema: {
          type: 'object',
          properties,
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle listing many schemas', async () => {
      const manySchemas: Record<string, any> = {}
      for (let i = 0; i < 50; i++) {
        manySchemas[`Schema${i}`] = { type: 'object' }
      }

      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          ...baseSpec,
          components: { schemas: manySchemas },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).count).toBe(50)
    })
  })

  describe('Update edge cases', () => {
    it('should handle updating required fields', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          required: ['id', 'name', 'email'],
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.required).toContain('email')
    })

    it('should handle adding additionalProperties constraint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          additionalProperties: false,
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.additionalProperties).toBe(false)
    })

    it('should handle changing schema type', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        schemaName: 'User',
        schema: {
          type: 'string',
          enum: ['admin', 'user', 'guest'],
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.type).toBe('string')
    })
  })

  describe('Concurrent operation scenarios', () => {
    it('should handle rapid add operations', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const schemas = ['Schema1', 'Schema2', 'Schema3', 'Schema4', 'Schema5']

      for (const name of schemas) {
        const result = await tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: name,
          schema: { type: 'object' },
        })
        expect(result.success).toBe(true)
        mockSpecManager.loadSpec.mockResolvedValue({
          version: '3.0',
          spec: JSON.parse(JSON.stringify(baseSpec)),
        } as any)
      }

      expect(mockSpecManager.saveSpec).toHaveBeenCalledTimes(5)
    })
  })

  describe('Storage failure recovery', () => {
    it('should rollback on save failure', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)
      mockSpecManager.saveSpec.mockRejectedValue(new Error('Save failed'))

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          schemaName: 'NewSchema',
          schema: { type: 'object' },
        })
      ).rejects.toThrow()

      // Verify audit wasn't logged on failure
      expect(mockAuditLogger.logEvent).not.toHaveBeenCalled()
    })
  })

  describe('Schema with $ref handling', () => {
    it('should handle schemas with internal references', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'UserProfile',
        schema: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            preferences: {
              type: 'object',
              properties: {
                theme: { type: 'string' },
              },
            },
          },
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle circular reference structure', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'Node',
        schema: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Node' },
            },
          },
        },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Special property names', () => {
    it('should handle properties with special characters', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        schemaName: 'SpecialProps',
        schema: {
          type: 'object',
          properties: {
            'user-id': { type: 'string' },
            'first_name': { type: 'string' },
            'data.value': { type: 'number' },
          },
        },
      })

      expect(result.success).toBe(true)
    })
  })
})

