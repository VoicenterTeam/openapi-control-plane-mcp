/**
 * Responses Configure Tool - Unit Tests
 */

import { ResponsesConfigureTool } from '../../../src/tools/responses-configure-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('ResponsesConfigureTool', () => {
  let tool: ResponsesConfigureTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  beforeEach(() => {
    mockSpecManager = { loadSpec: jest.fn(), saveSpec: jest.fn() } as any
    mockAuditLogger = { logEvent: jest.fn() } as any
    tool = new ResponsesConfigureTool(mockSpecManager, mockAuditLogger)
  })

  describe('list', () => {
    it('should list responses with multiple status codes', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {
                  '200': { description: 'Success' },
                  '400': { description: 'Bad request' },
                  '404': { description: 'Not found' },
                },
              },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
        path: '/users',
        method: 'GET',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(3)
      expect((result.data as any)?.responses).toBeInstanceOf(Array)
      expect((result.data as any)?.responses[0]).toHaveProperty('statusCode', '200')
    })

    it('should return empty list when no responses', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {},
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
        path: '/users',
        method: 'GET',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(0)
    })

    it('should fail when path not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { paths: {} },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'list',
        path: '/nonexistent',
        method: 'GET',
      })).rejects.toThrow('not found')
    })

    it('should fail when method not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: { responses: {} },
            },
          },
        },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'list',
        path: '/users',
        method: 'POST',
      })).rejects.toThrow('not found')
    })
  })

  describe('add', () => {
    it('should add response with full content', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              post: { responses: {} },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'POST',
        statusCode: '201',
        response: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.paths['/users'].post.responses['201']).toBeDefined()
    })

    it('should fail when response already exists', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {
                  '200': { description: 'Existing' },
                },
              },
            },
          },
        },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'GET',
        statusCode: '200',
        response: { description: 'Duplicate' },
      })).rejects.toThrow('already exists')
    })

    it('should fail when status code not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'POST',
        response: { description: 'Test' },
      } as any)).rejects.toThrow('Validation failed')
    })

    it('should fail when response object not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'POST',
        statusCode: '201',
      } as any)).rejects.toThrow('Validation failed')
    })

    it('should create responses object if missing', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {},
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'GET',
        statusCode: '200',
        response: { description: 'Success' },
      })

      expect(result.success).toBe(true)
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.paths['/users'].get.responses).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update response description', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {
                  '200': { description: 'Old description' },
                },
              },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        statusCode: '200',
        updates: { description: 'Updated description' },
      })

      expect(result.success).toBe(true)
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.paths['/users'].get.responses['200'].description).toBe('Updated description')
    })

    it('should update response content', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {
                  '200': {
                    description: 'Success',
                    content: {
                      'application/json': {
                        schema: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        statusCode: '200',
        updates: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })

    it('should fail when response does not exist', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {},
              },
            },
          },
        },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        statusCode: '404',
        updates: { description: 'Updated' },
      })).rejects.toThrow('not found')
    })

    it('should fail when updates not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        statusCode: '200',
      } as any)).rejects.toThrow('Validation failed')
    })
  })

  describe('delete', () => {
    it('should delete existing response', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              delete: {
                responses: {
                  '204': { description: 'Deleted' },
                  '404': { description: 'Not found' },
                },
              },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        method: 'DELETE',
        statusCode: '204',
      })

      expect(result.success).toBe(true)
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.paths['/users'].delete.responses['204']).toBeUndefined()
      expect(savedSpec.paths['/users'].delete.responses['404']).toBeDefined()
    })

    it('should fail when response does not exist', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                responses: {
                  '200': { description: 'Success' },
                },
              },
            },
          },
        },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        method: 'GET',
        statusCode: '404',
      })).rejects.toThrow('not found')
    })

    it('should fail when status code not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        method: 'GET',
      } as any)).rejects.toThrow('Validation failed')
    })
  })
})

