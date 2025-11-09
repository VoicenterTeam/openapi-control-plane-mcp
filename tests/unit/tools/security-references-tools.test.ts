/**
 * Security & References Tools - Combined Tests
 */

import { SecurityConfigureTool } from '../../../src/tools/security-configure-tool'
import { ReferencesManageTool } from '../../../src/tools/references-manage-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('SecurityConfigureTool', () => {
  let tool: SecurityConfigureTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>
  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  beforeEach(() => {
    mockSpecManager = { loadSpec: jest.fn(), saveSpec: jest.fn() } as any
    mockAuditLogger = { logEvent: jest.fn() } as any
    tool = new SecurityConfigureTool(mockSpecManager, mockAuditLogger)
  })

  it('should list security schemes', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
      },
    } as any)

    const result = await tool.execute({
      apiId,
      version,
      operation: 'list_schemes',
    })

    expect(result.success).toBe(true)
    expect((result.data as any)?.count).toBe(1)
  })

  it('should add security scheme', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: { components: {} },
    } as any)

    const result = await tool.execute({
      apiId,
      version,
      operation: 'add_scheme',
      schemeName: 'bearerAuth',
      scheme: { type: 'http', scheme: 'bearer' },
    })

    expect(result.success).toBe(true)
    expect(mockSpecManager.saveSpec).toHaveBeenCalled()
  })
})

describe('ReferencesManageTool', () => {
  let tool: ReferencesManageTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>
  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  beforeEach(() => {
    mockSpecManager = { loadSpec: jest.fn(), saveSpec: jest.fn() } as any
    mockAuditLogger = { logEvent: jest.fn() } as any
    tool = new ReferencesManageTool(mockSpecManager, mockAuditLogger)
  })

  it('should find references', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' },
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
      operation: 'find',
      componentName: 'User',
      componentType: 'schemas',
    })

    expect(result.success).toBe(true)
    expect((result.data as any)?.usageCount).toBeGreaterThan(0)
  })

  it('should validate references', async () => {
    mockSpecManager.loadSpec.mockResolvedValue({
      version: '3.0',
      spec: {
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' },
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
      operation: 'validate',
    })

    expect(result.success).toBe(true)
    expect((result.data as any)?.brokenRefs).toBe(0)
  })
})

