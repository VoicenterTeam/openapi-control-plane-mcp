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

  it('should list responses', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        paths: {
          '/users': {
            get: {
              responses: {
                '200': { description: 'Success' },
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
    expect((result.data as any)?.count).toBe(2)
  })

  it('should add response', async () => {
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
      response: { description: 'Created' },
    })

    expect(result.success).toBe(true)
    expect(mockSpecManager.saveSpec).toHaveBeenCalled()
  })

  it('should update response', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        paths: {
          '/users': {
            get: {
              responses: {
                '200': { description: 'Old' },
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
      updates: { description: 'New' },
    })

    expect(result.success).toBe(true)
    expect(mockSpecManager.saveSpec).toHaveBeenCalled()
  })

  it('should delete response', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        paths: {
          '/users': {
            delete: {
              responses: {
                '204': { description: 'Deleted' },
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
    expect(mockSpecManager.saveSpec).toHaveBeenCalled()
  })
})

