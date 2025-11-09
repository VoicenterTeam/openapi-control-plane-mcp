/**
 * Endpoint Management Tool - Unit Tests
 *
 * @description Comprehensive tests for endpoint management operations
 */

import { EndpointManageTool } from '../../../src/tools/endpoint-manage-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('EndpointManageTool', () => {
  let tool: EndpointManageTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const baseSpec = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          summary: 'List users',
          responses: { '200': { description: 'Success' } },
        },
        post: {
          summary: 'Create user',
          responses: { '201': { description: 'Created' } },
        },
      },
      '/users/{id}': {
        get: {
          summary: 'Get user',
          responses: { '200': { description: 'Success' } },
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

    tool = new EndpointManageTool(mockSpecManager, mockAuditLogger)
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('endpoint_manage')
      expect(description.description).toContain('Manage OpenAPI endpoints')
      expect(description.inputSchema.required).toContain('apiId')
      expect(description.inputSchema.required).toContain('version')
      expect(description.inputSchema.required).toContain('operation')
    })
  })

  describe('list operation', () => {
    it('should list all endpoints', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(result.success).toBe(true)
      expect(result.content[0].text).toContain('Found 2 endpoints')
      expect((result.data as any).count).toBe(2)
      expect((result.data as any).endpoints).toHaveLength(2)
    })

    it('should return empty list for spec with no paths', async () => {
      const emptySpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
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
    })

    it('should include operation summaries', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      const endpoints = (result.data as any).endpoints
      const usersEndpoint = endpoints.find((e: any) => e.path === '/users')

      expect(usersEndpoint.methods).toContain('get')
      expect(usersEndpoint.methods).toContain('post')
      expect(usersEndpoint.operations.get).toBe('List users')
      expect(usersEndpoint.operations.post).toBe('Create user')
    })
  })

  describe('add operation', () => {
    it('should add a new endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const newOperation = {
        summary: 'Delete user',
        description: 'Delete a user by ID',
        responses: {
          '204': { description: 'No content' },
          '404': { description: 'Not found' },
        },
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users/{id}',
        method: 'DELETE',
        operationObject: newOperation,
      })

      expect(result.success).toBe(true)
      expect(result.content[0].text).toContain('Added endpoint DELETE /users/{id}')
      expect((result.data as any).method).toBe('delete')
      expect((result.data as any).operation).toEqual(newOperation)

      expect(mockSpecManager.saveSpec).toHaveBeenCalledWith(
        apiId,
        version,
        expect.objectContaining({
          paths: expect.objectContaining({
            '/users/{id}': expect.objectContaining({
              delete: newOperation,
            }),
          }),
        })
      )

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'endpoint_added',
          details: expect.objectContaining({
            path: '/users/{id}',
            method: 'delete',
          }),
        })
      )
    })

    it('should add a new path with operation', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const newOperation = {
        summary: 'List products',
        responses: { '200': { description: 'Success' } },
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/products',
        method: 'GET',
        operationObject: newOperation,
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalledWith(
        apiId,
        version,
        expect.objectContaining({
          paths: expect.objectContaining({
            '/products': {
              get: newOperation,
            },
          }),
        })
      )
    })

    it('should reject duplicate endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          path: '/users',
          method: 'GET',
          operationObject: { summary: 'Duplicate' },
        })
      ).rejects.toThrow('already exists')
    })

    it('should handle lowercase method names', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users/{id}',
        method: 'patch',
        operationObject: { summary: 'Update user' },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).method).toBe('patch')
    })

    it('should create paths object if missing', async () => {
      const specNoPaths = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
      }
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: specNoPaths,
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/test',
        method: 'GET',
        operationObject: { summary: 'Test' },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalledWith(
        apiId,
        version,
        expect.objectContaining({
          paths: expect.objectContaining({
            '/test': { get: { summary: 'Test' } },
          }),
        })
      )
    })

    it('should include llmReason in audit log', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/new',
        method: 'POST',
        operationObject: { summary: 'New' },
        llmReason: 'User requested new endpoint',
      })

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          llm_reason: 'User requested new endpoint',
        })
      )
    })
  })

  describe('update operation', () => {
    it('should update an existing endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const updates = {
        summary: 'List all users (updated)',
        description: 'Get a paginated list of all users',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
      }

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        updates,
      })

      expect(result.success).toBe(true)
      expect(result.content[0].text).toContain('Updated endpoint GET /users')
      expect((result.data as any).changes).toEqual(['summary', 'description', 'parameters'])

      expect(mockSpecManager.saveSpec).toHaveBeenCalledWith(
        apiId,
        version,
        expect.objectContaining({
          paths: expect.objectContaining({
            '/users': expect.objectContaining({
              get: expect.objectContaining({
                summary: 'List all users (updated)',
                description: 'Get a paginated list of all users',
              }),
            }),
          }),
        })
      )

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'endpoint_updated',
          details: expect.objectContaining({
            path: '/users',
            method: 'get',
            updated_fields: ['summary', 'description', 'parameters'],
          }),
        })
      )
    })

    it('should merge updates with existing operation', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        updates: {
          description: 'New description',
        },
      })

      expect(result.success).toBe(true)
      // Should preserve original summary
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2]
      expect((savedSpec as any).paths['/users'].get.summary).toBe('List users')
      expect((savedSpec as any).paths['/users'].get.description).toBe('New description')
    })

    it('should reject update on non-existent endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'update',
          path: '/nonexistent',
          method: 'GET',
          updates: { summary: 'Test' },
        })
      ).rejects.toThrow('not found')
    })
  })

  describe('delete operation', () => {
    it('should delete an endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        method: 'POST',
      })

      expect(result.success).toBe(true)
      expect(result.content[0].text).toContain('Deleted endpoint POST /users')
      expect((result.data as any).pathDeleted).toBe(false) // GET method still exists

      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2]
      expect((savedSpec as any).paths['/users'].post).toBeUndefined()
      expect((savedSpec as any).paths['/users'].get).toBeDefined()

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'endpoint_deleted',
          details: expect.objectContaining({
            path: '/users',
            method: 'post',
          }),
        })
      )
    })

    it('should delete path if last method is removed', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users/{id}',
        method: 'GET',
      })

      expect(result.success).toBe(true)
      expect((result.data as any).pathDeleted).toBe(true)

      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2]
      expect((savedSpec as any).paths['/users/{id}']).toBeUndefined()
    })

    it('should reject delete on non-existent endpoint', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(baseSpec)),
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'delete',
          path: '/nonexistent',
          method: 'GET',
        })
      ).rejects.toThrow('not found')
    })
  })

  describe('validation', () => {
    it('should validate required parameters', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'invalid' as any,
        })
      ).rejects.toThrow('Validation failed')
    })

    it('should require path for add operation', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          method: 'GET',
          operationObject: {},
        } as any)
      ).rejects.toThrow()
    })

    it('should require method for add operation', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          path: '/test',
          operationObject: {},
        } as any)
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle spec load failure', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Load failed'))

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'list',
        })
      ).rejects.toThrow('Endpoint management failed')
    })

    it('should handle spec save failure', async () => {
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
          path: '/test',
          method: 'GET',
          operationObject: { summary: 'Test' },
        })
      ).rejects.toThrow()
    })
  })
})

