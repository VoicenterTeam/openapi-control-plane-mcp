/**
 * Integration Tests - Spec Read Workflow
 *
 * @description Tests end-to-end workflow for reading OpenAPI specs
 */

import { FileSystemStorage } from '../../src/storage/file-system-storage'
import { SpecManager } from '../../src/services/spec-manager'
import { SpecReadTool } from '../../src/tools/spec-read-tool'
import { createApiId, createVersionTag } from '../../src/types/openapi'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Integration: Spec Read Workflow', () => {
  let tempDir: string
  let storage: FileSystemStorage
  let specManager: SpecManager
  let specReadTool: SpecReadTool
  const apiId = createApiId('petstore-api')
  const version = createVersionTag('v1.0.0')

  beforeEach(async () => {
    // Create temp directory for test data
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spec-read-test-'))
    storage = new FileSystemStorage({ basePath: tempDir })
    specManager = new SpecManager(storage)
    specReadTool = new SpecReadTool(specManager)

    // Create a sample spec in storage
    const sampleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Petstore API',
        version: '1.0.0',
        description: 'A sample Pet Store API',
      },
      servers: [
        {
          url: 'https://petstore.swagger.io/v2',
          description: 'Production server',
        },
      ],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'listPets',
            tags: ['pets'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'Maximum number of pets to return',
                required: false,
                schema: {
                  type: 'integer',
                  format: 'int32',
                },
              },
            ],
            responses: {
              '200': {
                description: 'An array of pets',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pets',
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: 'Create a pet',
            operationId: 'createPet',
            tags: ['pets'],
            responses: {
              '201': {
                description: 'Pet created',
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            summary: 'Get a pet by ID',
            operationId: 'getPetById',
            tags: ['pets'],
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A pet',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Pet: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              name: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
            },
          },
          Pets: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Pet',
            },
          },
        },
      },
    }

    await specManager.saveSpec(apiId, version, sampleSpec)
  })

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('Full spec retrieval', () => {
    it('should retrieve complete spec', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'full_spec',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).spec.openapi).toBe('3.0.0')
      expect((result.data as any).spec.info.title).toBe('Petstore API')
    })
  })

  describe('Endpoint listing', () => {
    it('should list all endpoints', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'endpoints_list',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      const endpoints = (result.data as any).endpoints
      expect(endpoints).toHaveLength(3)
      expect(endpoints).toContainEqual(
        expect.objectContaining({
          path: '/pets',
          method: 'get',
        })
      )
      expect(endpoints).toContainEqual(
        expect.objectContaining({
          path: '/pets',
          method: 'post',
        })
      )
      expect(endpoints).toContainEqual(
        expect.objectContaining({
          path: '/pets/{petId}',
          method: 'get',
        })
      )
    })

    it('should filter endpoints by method', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'endpoints_list',
        method: 'GET',
      })

      expect(result.success).toBe(true)
      const endpoints = (result.data as any).endpoints
      expect(endpoints).toHaveLength(2)
      expect(endpoints.every((e: any) => e.method === 'get')).toBe(true)
    })
  })

  describe('Endpoint details', () => {
    it('should retrieve specific endpoint details', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'endpoint_detail',
        path: '/pets',
        method: 'GET',
      })

      expect(result.success).toBe(true)
      const data = result.data as any
      expect(data.summary).toBe('List all pets')
      expect(data.operationId).toBe('listPets')
      expect(data.parameters).toHaveLength(1)
      expect(data.parameters[0].name).toBe('limit')
    })

    it('should return error for non-existent endpoint', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'endpoint_detail',
        path: '/nonexistent',
        method: 'GET',
      })

      expect(result.success).toBe(false)
      expect(result.content[0].text).toContain('not found')
    })
  })

  describe('Schema retrieval', () => {
    it('should retrieve schema details', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'schema_detail',
        schemaName: 'Pet',
      })

      expect(result.success).toBe(true)
      const schema = result.data as any
      expect(schema.type).toBe('object')
      expect(schema.required).toEqual(['id', 'name'])
      expect(schema.properties.id.type).toBe('integer')
      expect(schema.properties.name.type).toBe('string')
    })

    it('should return error for non-existent schema', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'schema_detail',
        schemaName: 'NonExistent',
      })

      expect(result.success).toBe(false)
      expect(result.content[0].text).toContain('not found')
    })
  })

  describe('Info retrieval', () => {
    it('should retrieve API info', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'info',
      })

      expect(result.success).toBe(true)
      const info = result.data as any
      expect(info.title).toBe('Petstore API')
      expect(info.version).toBe('1.0.0')
      expect(info.description).toBe('A sample Pet Store API')
    })
  })

  describe('Servers retrieval', () => {
    it('should retrieve server list', async () => {
      const result = await specReadTool.execute({
        apiId,
        version,
        queryType: 'servers',
      })

      expect(result.success).toBe(true)
      const servers = result.data as any
      expect(servers).toHaveLength(1)
      expect(servers[0].url).toBe('https://petstore.swagger.io/v2')
      expect(servers[0].description).toBe('Production server')
    })
  })

  describe('Error handling', () => {
    it('should handle non-existent API', async () => {
      const result = await specReadTool.execute({
        apiId: 'non-existent' as any,
        version: 'v1.0.0' as any,
        queryType: 'full_spec',
      })

      expect(result.success).toBe(false)
      expect(result.content[0].text).toBeDefined()
    })

    it('should handle invalid parameters', async () => {
      await expect(
        specReadTool.execute({
          apiId,
          version,
          // Missing required 'queryType' field
        } as any)
      ).rejects.toThrow()
    })
  })
})

