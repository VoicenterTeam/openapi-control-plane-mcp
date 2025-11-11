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

  describe('list_schemes', () => {
    it('should list security schemes', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            securitySchemes: {
              apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
              bearer: { type: 'http', scheme: 'bearer' },
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
      expect((result.data as any)?.count).toBe(2)
      expect((result.data as any)?.schemes).toBeInstanceOf(Array)
      expect((result.data as any)?.schemes).toHaveLength(2)
    })

    it('should return empty list when no security schemes', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { components: {} },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'list_schemes',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.count).toBe(0)
    })
  })

  describe('add_scheme', () => {
    it('should add API key security scheme', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { components: {} },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add_scheme',
        schemeName: 'apiKey',
        scheme: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.components.securitySchemes.apiKey).toBeDefined()
    })

    it('should add OAuth2 security scheme', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { components: {} },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'add_scheme',
        schemeName: 'oauth2',
        scheme: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access', write: 'Write access' },
            },
          },
        },
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
    })

    it('should fail when scheme name not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'add_scheme',
        scheme: { type: 'http', scheme: 'bearer' },
      } as any)).rejects.toThrow('Validation failed')
    })

    it('should fail when scheme object not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'add_scheme',
        schemeName: 'bearer',
      } as any)).rejects.toThrow('Validation failed')
    })
  })

  describe('delete_scheme', () => {
    it('should delete existing security scheme', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            securitySchemes: {
              apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
              bearer: { type: 'http', scheme: 'bearer' },
            },
          },
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'delete_scheme',
        schemeName: 'apiKey',
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.components.securitySchemes.apiKey).toBeUndefined()
      expect(savedSpec.components.securitySchemes.bearer).toBeDefined()
    })

    it('should fail when deleting non-existent scheme', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { components: { securitySchemes: {} } },
      } as any)

      await expect(tool.execute({
        apiId,
        version,
        operation: 'delete_scheme',
        schemeName: 'nonexistent',
      })).rejects.toThrow('not found')
    })
  })

  describe('set_global', () => {
    it('should set global security requirements', async () => {
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
        operation: 'set_global',
        security: [{ apiKey: [] }],
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.security).toEqual([{ apiKey: [] }])
    })

    it('should clear global security when empty array provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { security: [{ apiKey: [] }] },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'set_global',
        security: [],
      })

      expect(result.success).toBe(true)
      const savedSpec = mockSpecManager.saveSpec.mock.calls[0][2] as any
      expect(savedSpec.security).toEqual([])
    })

    it('should fail when security not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'set_global',
      } as any)).rejects.toThrow('Validation failed')
    })
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

  describe('find', () => {
    it('should find schema references', async () => {
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
              post: {
                requestBody: {
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
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'find',
        componentName: 'User',
        componentType: 'schemas',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.usageCount).toBe(2)
      expect((result.data as any)?.usages).toHaveLength(2)
    })

    it('should find response references', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            responses: {
              NotFound: { description: 'Not found' },
            },
          },
          paths: {
            '/users/{id}': {
              get: {
                responses: {
                  '404': { $ref: '#/components/responses/NotFound' },
                },
              },
            },
            '/posts/{id}': {
              get: {
                responses: {
                  '404': { $ref: '#/components/responses/NotFound' },
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
        componentName: 'NotFound',
        componentType: 'responses',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.usageCount).toBeGreaterThan(0)
    })

    it('should return zero count for unused component', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            schemas: {
              UnusedSchema: { type: 'object' },
            },
          },
          paths: {},
        },
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        operation: 'find',
        componentName: 'UnusedSchema',
        componentType: 'schemas',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.usageCount).toBe(0)
    })

    it('should fail when component name not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'find',
        componentType: 'schemas',
      } as any)).rejects.toThrow('Validation failed')
    })
  })

  describe('validate', () => {
    it('should validate all references successfully', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            schemas: {
              User: { type: 'object' },
              Post: { type: 'object' },
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
            '/posts': {
              get: {
                responses: {
                  '200': {
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Post' },
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
      expect((result.data as any)?.totalRefs).toBeGreaterThan(0)
      expect((result.data as any)?.brokenRefs).toBe(0)
    })

    it('should detect broken references', async () => {
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
                        schema: { $ref: '#/components/schemas/NonExistent' },
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
      expect((result.data as any)?.brokenRefs).toBe(1)
      expect((result.data as any)?.broken).toHaveLength(1)
    })
  })

  describe('update', () => {
    it('should update references', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: {
          components: {
            schemas: {
              User: { type: 'object' },
              UserV2: { type: 'object' },
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
        operation: 'update',
        oldRef: '#/components/schemas/User',
        newRef: '#/components/schemas/UserV2',
      })

      expect(result.success).toBe(true)
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect((result.data as any)?.updateCount).toBeGreaterThan(0)
    })

    it('should fail when old ref not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'update',
        newRef: '#/components/schemas/User',
      } as any)).rejects.toThrow('Validation failed')
    })

    it('should fail when new ref not provided', async () => {
      await expect(tool.execute({
        apiId,
        version,
        operation: 'update',
        oldRef: '#/components/schemas/User',
      } as any)).rejects.toThrow('Validation failed')
    })
  })
})

