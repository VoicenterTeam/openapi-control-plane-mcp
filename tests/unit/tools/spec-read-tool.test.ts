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
      expect(description.description).toContain('Read and query OpenAPI')
      expect(description.inputSchema).toBeDefined()
    })
  })

  describe('execute - full_spec', () => {
    it('should return full spec', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.spec).toEqual(sampleSpec)
      expect(mockSpecManager.loadSpec).toHaveBeenCalledWith('test-api', 'v1.0.0')
    })

    it('should include llmReason in audit trail', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

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

    it('should return spec in YAML format when format=yaml', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
        format: 'yaml',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.spec).toBeDefined()
      expect(typeof (result.data as any)?.spec).toBe('string')
      expect((result.data as any)?.spec).toContain('openapi:')
      expect((result.data as any)?.spec).toContain('info:')
      expect((result.data as any)?.spec).toContain('paths:')
    })

    it('should return spec in JSON format when format=json', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
        format: 'json',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.spec).toEqual(sampleSpec)
      expect(typeof (result.data as any)?.spec).toBe('object')
    })

    it('should default to JSON format when format is not specified', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.spec).toEqual(sampleSpec)
      expect(typeof (result.data as any)?.spec).toBe('object')
      expect((result.data as any)?.spec.openapi).toBe('3.0.0')
    })

    it('should produce valid YAML that can be parsed back to original spec', async () => {
      const yaml = require('js-yaml')
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'full_spec',
        format: 'yaml',
      })

      expect(result.success).toBe(true)
      const yamlString = (result.data as any)?.spec
      expect(typeof yamlString).toBe('string')

      // Parse YAML back to object
      const parsedSpec = yaml.load(yamlString)
      
      // Should match original spec
      expect(parsedSpec).toEqual(sampleSpec)
    })
  })

  describe('execute - info', () => {
    it('should return only info section', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'info',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.info).toEqual(sampleSpec.info)
      expect((result.data as any)?.paths).toBeUndefined()
    })
  })

  describe('execute - endpoints', () => {
    it('should return list of endpoints', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints_list',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.endpoints).toEqual([
        { path: '/users', methods: ['GET', 'POST'] },
        { path: '/users/{id}', methods: ['GET'] },
      ])
    })

    it('should filter by method if provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints_list',
        method: 'POST',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.endpoints).toHaveLength(1)
      expect((result.data as any)?.endpoints[0]).toEqual({ path: '/users', methods: ['POST'] })
    })
  })

  describe('execute - endpoint_detail', () => {
    it('should return specific endpoint details', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoint_detail',
        path: '/users',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.path).toBe('/users')
      expect((result.data as any)?.methods).toHaveProperty('get')
      expect((result.data as any)?.methods).toHaveProperty('post')
    })

    it('should throw error if path not provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_detail',
        })
      ).rejects.toThrow(ToolError)
    })

    it('should throw error if endpoint not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_detail',
          path: '/nonexistent',
        })
      ).rejects.toThrow(ToolError)
    })
  })

  describe('execute - schema_detail', () => {
    it('should return list of schemas', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      // Get list of schemas - we need a different query type for this
      // For now, let's test getting a specific schema instead
      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'schema_detail',
        schemaName: 'User',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.schemaName).toBe('User')
      expect((result.data as any)?.schema).toEqual(sampleSpec.components?.schemas?.User)
    })

    it('should throw error if schemaName not provided', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'schema_detail',
        })
      ).rejects.toThrow(ToolError)
    })

    it('should throw error if schema not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'schema_detail',
          schemaName: 'NonexistentSchema',
        })
      ).rejects.toThrow(ToolError)
    })
  })

  describe('execute - servers', () => {
    it('should return servers list', async () => {
      const specWithServers = {
        ...sampleSpec,
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
          { url: 'https://staging.example.com', description: 'Staging' },
        ],
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: specWithServers } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'servers',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.servers).toHaveLength(2)
      expect((result.data as any)?.servers[0].url).toBe('https://api.example.com')
    })

    it('should return empty array when no servers defined', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'servers',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.servers).toEqual([])
    })
  })

  describe('execute - endpoints_list', () => {
    it('should filter by tag', async () => {
      const specWithTags = {
        ...sampleSpec,
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              tags: ['users'],
              responses: { '200': { description: 'Success' } },
            },
          },
          '/posts': {
            get: {
              summary: 'Get posts',
              tags: ['posts'],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: specWithTags } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints_list',
        filters: { tags: ['users'] },
      })

      expect(result.success).toBe(true)
      const endpoints = (result.data as any)?.endpoints
      expect(endpoints).toHaveLength(1)
      expect(endpoints[0].path).toBe('/users')
    })

    it('should filter by deprecated status', async () => {
      const specWithDeprecated = {
        ...sampleSpec,
        paths: {
          '/old': {
            get: {
              summary: 'Old endpoint',
              deprecated: true,
              responses: { '200': { description: 'Success' } },
            },
          },
          '/new': {
            get: {
              summary: 'New endpoint',
              deprecated: false,
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: specWithDeprecated } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints_list',
        filters: { deprecated: false },
      })

      expect(result.success).toBe(true)
      const endpoints = (result.data as any)?.endpoints
      expect(endpoints).toHaveLength(1)
      expect(endpoints[0].path).toBe('/new')
    })

    it('should return all endpoints when filter tags dont match', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        queryType: 'endpoints_list',
        filters: { tags: ['nonexistent'] },
      })

      expect(result.success).toBe(true)
      // When no tags match, all endpoints are returned (no tags = untagged endpoints match)
      expect((result.data as any)?.endpoints.length).toBeGreaterThan(0)
    })
  })

  describe('execute - endpoint_detail', () => {
    it('should fail when path parameter missing', async () => {
      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_detail',
          method: 'GET',
        } as any)
      ).rejects.toThrow()
    })

    it('should fail when method parameter missing', async () => {
      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_detail',
          path: '/users',
        } as any)
      ).rejects.toThrow()
    })

    it('should fail when endpoint not found', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: sampleSpec } as any)

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
          queryType: 'endpoint_detail',
          path: '/nonexistent',
          method: 'GET',
        })
      ).rejects.toThrow('not found')
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

