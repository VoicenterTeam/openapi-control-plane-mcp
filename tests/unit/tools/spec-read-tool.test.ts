/**
 * Tests for SpecReadTool
 *
 * @description Tests for the spec_read MCP tool.
 * Testing a read tool is like testing a waiter - can they take your order
 * correctly and bring you exactly what you asked for? 🍽️
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { SpecReadTool } from '../../../src/tools/spec-read-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { ToolError } from '../../../src/utils/errors'
import type { OpenAPI } from 'openapi-types'

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  logStorageOperation: jest.fn(),
}))

describe('SpecReadTool', () => {
  let tool: SpecReadTool
  let mockSpecManager: jest.Mocked<SpecManager>

  const sampleSpec: OpenAPI.Document = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API',
    },
    paths: {
      '/users': {
        get: {
          summary: 'Get users',
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
        post: {
          summary: 'Create user',
          responses: {
            '201': {
              description: 'Created',
            },
          },
        },
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by ID',
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        UserList: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    },
  }

  beforeEach(() => {
    mockSpecManager = {
      loadSpec: jest.fn(),
      saveSpec: jest.fn(),
      specExists: jest.fn(),
      deleteSpec: jest.fn(),
    } as unknown as jest.Mocked<SpecManager>

    tool = new SpecReadTool(mockSpecManager)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('spec_read')
      expect(description.description).toContain('Read OpenAPI specification')
      expect(description.inputSchema).toBeDefined()
    })
  })

  describe('execute - full_spec', () => {
    it('should return full spec', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
      })

      expect(result.success).toBe(true)
      expect(result.data?.spec).toEqual(sampleSpec)
      expect(mockSpecManager.loadSpec).toHaveBeenCalledWith('test-api', 'v1.0.0')
    })

    it('should include llmReason in audit trail', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
        llmReason: 'User requested API spec for review',
      })

      expect(result.success).toBe(true)
    })

    it('should throw ToolError if spec not found', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Spec not found'))

      await expect(
        tool.execute({
          apiId: 'missing-api',
          version: 'v1.0.0',
          queryType: 'full_spec',
        })
      ).rejects.toThrow(ToolError)
    })
  })

  describe('execute - info', () => {
    it('should return only info section', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'info',
      })

      expect(result.success).toBe(true)
      expect(result.data?.info).toEqual(sampleSpec.info)
      expect(result.data?.paths).toBeUndefined()
    })
  })

  describe('execute - endpoints', () => {
    it('should return list of endpoints', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints',
      })

      expect(result.success).toBe(true)
      expect(result.data?.endpoints).toEqual([
        { path: '/users', methods: ['GET', 'POST'] },
        { path: '/users/{id}', methods: ['GET'] },
      ])
    })

    it('should filter by method if provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints',
        method: 'POST',
      })

      expect(result.success).toBe(true)
      expect(result.data?.endpoints).toHaveLength(1)
      expect(result.data?.endpoints[0]).toEqual({ path: '/users', methods: ['POST'] })
    })
  })

  describe('execute - endpoint_details', () => {
    it('should return specific endpoint details', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoint_details',
        path: '/users',
      })

      expect(result.success).toBe(true)
      expect(result.data?.path).toBe('/users')
      expect(result.data?.methods).toHaveProperty('get')
      expect(result.data?.methods).toHaveProperty('post')
    })

    it('should throw error if path not provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_details',
        })
      ).rejects.toThrow(ToolError)
    })

    it('should throw error if endpoint not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_details',
          path: '/nonexistent',
        })
      ).rejects.toThrow(ToolError)
    })
  })

  describe('execute - schemas', () => {
    it('should return list of schemas', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'schemas',
      })

      expect(result.success).toBe(true)
      expect(result.data?.schemas).toEqual(['User', 'UserList'])
    })

    it('should return empty array if no schemas', async () => {
      const specWithoutSchemas = { ...sampleSpec, components: undefined }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: specWithoutSchemas })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'schemas',
      })

      expect(result.success).toBe(true)
      expect(result.data?.schemas).toEqual([])
    })
  })

  describe('execute - schema_details', () => {
    it('should return specific schema details', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'schema_details',
        schemaName: 'User',
      })

      expect(result.success).toBe(true)
      expect(result.data?.schemaName).toBe('User')
      expect(result.data?.schema).toEqual(sampleSpec.components?.schemas?.User)
    })

    it('should throw error if schemaName not provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'schema_details',
        })
      ).rejects.toThrow(ToolError)
    })

    it('should throw error if schema not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec })

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'schema_details',
          schemaName: 'NonexistentSchema',
        })
      ).rejects.toThrow(ToolError)
    })
  })

  describe('validation', () => {
    it('should validate apiId format', async () => {
      await expect(
        tool.execute({
          apiId: 'InvalidAPIId',
          version: 'v1.0.0',
          queryType: 'full_spec',
        })
      ).rejects.toThrow()
    })

    it('should validate version format', async () => {
      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'invalid',
          queryType: 'full_spec',
        })
      ).rejects.toThrow()
    })

    it('should reject invalid query types', async () => {
      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'invalid_type' as any,
        })
      ).rejects.toThrow()
    })
  })
})

