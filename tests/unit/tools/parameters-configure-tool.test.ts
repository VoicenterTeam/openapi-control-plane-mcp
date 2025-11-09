/**
 * Parameters Configure Tool - Unit Tests
 */

import { ParametersConfigureTool } from '../../../src/tools/parameters-configure-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('ParametersConfigureTool', () => {
  let tool: ParametersConfigureTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  beforeEach(() => {
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
    } as any

    mockAuditLogger = {
      logEvent: jest.fn(),
    } as any

    tool = new ParametersConfigureTool(mockSpecManager, mockAuditLogger)
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const desc = tool.describe()
      expect(desc.name).toBe('parameters_configure')
      expect(desc.description).toContain('parameter')
      expect(desc.inputSchema.required).toContain('apiId')
    })
  })

  describe('list operation', () => {
    it('should list path-level parameters', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users/{id}': {
              parameters: [
                { name: 'id', in: 'path', required: true },
                { name: 'api_key', in: 'header' },
              ],
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list',
        path: '/users/{id}',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(2)
    })

    it('should list operation-level parameters', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              get: {
                parameters: [{ name: 'limit', in: 'query' }],
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
      expect((result.data as any)?.count).toBe(1)
    })
  })

  describe('add operation', () => {
    it('should add path-level parameter', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {},
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        parameter: {
          name: 'api_key',
          in: 'header',
          required: true,
          schema: { type: 'string' },
        },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockAuditLogger.logEvent).toHaveBeenCalled()
    })

    it('should add operation-level parameter', async () => {
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
        parameter: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer' },
        },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })

    it('should reject duplicate parameter', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              parameters: [{ name: 'api_key', in: 'header' }],
            },
          },
        },
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'add',
          path: '/users',
          parameter: {
            name: 'api_key',
            in: 'header',
            schema: { type: 'string' },
          },
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('update operation', () => {
    it('should update parameter', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              parameters: [{ name: 'limit', in: 'query', description: 'Old' }],
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        parameterName: 'limit',
        parameterIn: 'query',
        updates: { description: 'New description', required: true },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })

    it('should reject non-existent parameter', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {},
          },
        },
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'update',
          path: '/users',
          parameterName: 'limit',
          parameterIn: 'query',
          updates: {},
        })
      ).rejects.toThrow('not found')
    })
  })

  describe('delete operation', () => {
    it('should delete parameter', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          paths: {
            '/users': {
              parameters: [{ name: 'api_key', in: 'header' }],
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        parameterName: 'api_key',
        parameterIn: 'header',
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })
  })

  describe('validation', () => {
    it('should validate apiId', async () => {
      await expect(
        tool.execute({
          apiId: '',
          version,
          operation: 'list',
          path: '/users',
        } as any)
      ).rejects.toThrow()
    })

    it('should validate path format', async () => {
      await expect(
        tool.execute({
          apiId,
          version,
          operation: 'list',
          path: 'users',
        } as any)
      ).rejects.toThrow()
    })
  })
})

