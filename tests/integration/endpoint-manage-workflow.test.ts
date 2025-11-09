/**
 * Endpoint Management Tool - Integration Tests
 *
 * @description End-to-end tests for endpoint management workflows
 */

import { EndpointManageTool } from '../../src/tools/endpoint-manage-tool'
import { SpecManager } from '../../src/services/spec-manager'
import { AuditLogger } from '../../src/services/audit-logger'
import { FileSystemStorage } from '../../src/storage/file-system-storage'
import { createApiId, createVersionTag } from '../../src/types/openapi'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('EndpointManageTool - Integration', () => {
  const testDataDir = path.join(__dirname, '../test-data-endpoint')
  let storage: FileSystemStorage
  let specManager: SpecManager
  let auditLogger: AuditLogger
  let tool: EndpointManageTool

  const apiId = createApiId('integration-api')
  const version = createVersionTag('v1.0.0')

  beforeAll(async () => {
    // Clean up test data directory
    await fs.rm(testDataDir, { recursive: true, force: true })
    await fs.mkdir(testDataDir, { recursive: true })

    // Initialize storage and services
    storage = new FileSystemStorage({ basePath: testDataDir })
    specManager = new SpecManager(storage)
    auditLogger = new AuditLogger(storage)
    tool = new EndpointManageTool(specManager, auditLogger)
  })

  afterAll(async () => {
    // Cleanup
    await fs.rm(testDataDir, { recursive: true, force: true })
  })

  describe('End-to-end endpoint management workflow', () => {
    it('should create an API spec and manage endpoints', async () => {
      // Step 1: Create base spec
      const baseSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Integration Test API',
          version: '1.0.0',
          description: 'API for integration testing',
        },
        paths: {},
      }

      await specManager.saveSpec(apiId, version, baseSpec)

      // Step 2: List endpoints (should be empty)
      const listResult1 = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(listResult1.success).toBe(true)
      expect((listResult1.data as any).count).toBe(0)

      // Step 3: Add first endpoint
      const addResult1 = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'GET',
        operationObject: {
          summary: 'List all users',
          description: 'Returns a paginated list of users',
          tags: ['users'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: { type: 'array' },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        llmReason: 'Initial users endpoint',
      })

      expect(addResult1.success).toBe(true)
      expect((addResult1.data as any).path).toBe('/users')
      expect((addResult1.data as any).method).toBe('get')

      // Step 4: Add POST to same path
      const addResult2 = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users',
        method: 'POST',
        operationObject: {
          summary: 'Create a new user',
          tags: ['users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                  },
                  required: ['name', 'email'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '400': { description: 'Bad Request' },
          },
        },
      })

      expect(addResult2.success).toBe(true)

      // Step 5: Add another path
      const addResult3 = await tool.execute({
        apiId,
        version,
        operation: 'add',
        path: '/users/{id}',
        method: 'GET',
        operationObject: {
          summary: 'Get user by ID',
          tags: ['users'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Success' },
            '404': { description: 'User not found' },
          },
        },
      })

      expect(addResult3.success).toBe(true)

      // Step 6: List all endpoints
      const listResult2 = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect(listResult2.success).toBe(true)
      expect((listResult2.data as any).count).toBe(2) // 2 paths
      const endpoints = (listResult2.data as any).endpoints
      expect(endpoints).toHaveLength(2)

      const usersEndpoint = endpoints.find((e: any) => e.path === '/users')
      expect(usersEndpoint.methods).toEqual(['get', 'post'])

      // Step 7: Update an endpoint
      const updateResult = await tool.execute({
        apiId,
        version,
        operation: 'update',
        path: '/users',
        method: 'GET',
        updates: {
          description: 'Returns a paginated list of users with advanced filtering',
          deprecated: false,
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
            },
            {
              name: 'sort',
              in: 'query',
              schema: { type: 'string', enum: ['name', 'email', 'created'] },
            },
          ],
        },
        llmReason: 'Add sorting capability',
      })

      expect(updateResult.success).toBe(true)
      expect((updateResult.data as any).changes).toContain('description')
      expect((updateResult.data as any).changes).toContain('parameters')

      // Verify the update persisted
      const loadedSpec = await specManager.loadSpec(apiId, version)
      const spec = (loadedSpec as any).spec || loadedSpec
      expect(spec.paths['/users'].get.parameters).toHaveLength(3)

      // Step 8: Delete an endpoint
      const deleteResult1 = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users',
        method: 'POST',
        llmReason: 'Removing create user endpoint temporarily',
      })

      expect(deleteResult1.success).toBe(true)
      expect((deleteResult1.data as any).pathDeleted).toBe(false) // GET still exists

      // Step 9: Delete last method on a path
      const deleteResult2 = await tool.execute({
        apiId,
        version,
        operation: 'delete',
        path: '/users/{id}',
        method: 'GET',
      })

      expect(deleteResult2.success).toBe(true)
      expect((deleteResult2.data as any).pathDeleted).toBe(true)

      // Step 10: Verify final state
      const listResult3 = await tool.execute({
        apiId,
        version,
        operation: 'list',
      })

      expect((listResult3.data as any).count).toBe(1) // Only /users remains
      expect((listResult3.data as any).endpoints[0].methods).toEqual(['get'])

      // Step 11: Verify audit trail
      const auditLog = await auditLogger.getAuditLog(apiId)
      expect(auditLog.length).toBeGreaterThanOrEqual(5) // add, add, add, update, delete, delete
      
      const addEvents = auditLog.filter(e => e.event === 'endpoint_added')
      expect(addEvents).toHaveLength(3)

      const updateEvents = auditLog.filter(e => e.event === 'endpoint_updated')
      expect(updateEvents).toHaveLength(1)

      const deleteEvents = auditLog.filter(e => e.event === 'endpoint_deleted')
      expect(deleteEvents).toHaveLength(2)
    })

    it('should handle complex REST API patterns', async () => {
      const apiId2 = createApiId('rest-api')
      const version2 = createVersionTag('v2.0.0')

      // Create base spec
      const baseSpec = {
        openapi: '3.0.0',
        info: { title: 'REST API', version: '2.0.0' },
        paths: {},
      }

      await specManager.saveSpec(apiId2, version2, baseSpec)

      // Add full CRUD operations for a resource
      const resource = '/products'
      const methods = [
        { method: 'GET', summary: 'List products' },
        { method: 'POST', summary: 'Create product' },
      ]

      for (const { method, summary } of methods) {
        await tool.execute({
          apiId: apiId2,
          version: version2,
          operation: 'add',
          path: resource,
          method: method as 'GET' | 'POST',
          operationObject: {
            summary,
            responses: { '200': { description: 'Success' } },
          },
        })
      }

      const resourceById = '/products/{id}'
      const methodsById = [
        { method: 'GET', summary: 'Get product' },
        { method: 'PUT', summary: 'Update product' },
        { method: 'DELETE', summary: 'Delete product' },
      ]

      for (const { method, summary } of methodsById) {
        await tool.execute({
          apiId: apiId2,
          version: version2,
          operation: 'add',
          path: resourceById,
          method: method as 'GET' | 'PUT' | 'DELETE',
          operationObject: {
            summary,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: { '200': { description: 'Success' } },
          },
        })
      }

      // Verify all endpoints exist
      const listResult = await tool.execute({
        apiId: apiId2,
        version: version2,
        operation: 'list',
      })

      expect((listResult.data as any).count).toBe(2)
      
      const productsEndpoint = (listResult.data as any).endpoints.find(
        (e: any) => e.path === '/products'
      )
      expect(productsEndpoint.methods.sort()).toEqual(['get', 'post'])

      const productsByIdEndpoint = (listResult.data as any).endpoints.find(
        (e: any) => e.path === '/products/{id}'
      )
      expect(productsByIdEndpoint.methods.sort()).toEqual(['delete', 'get', 'put'])
    })

    it('should handle error scenarios gracefully', async () => {
      const apiId3 = createApiId('error-test')
      const version3 = createVersionTag('v1.0.0')

      // Create base spec
      await specManager.saveSpec(apiId3, version3, {
        openapi: '3.0.0',
        info: { title: 'Error Test', version: '1.0.0' },
        paths: {},
      })

      // Try to add duplicate endpoint
      await tool.execute({
        apiId: apiId3,
        version: version3,
        operation: 'add',
        path: '/test',
        method: 'GET',
        operationObject: { summary: 'Test' },
      })

      await expect(
        tool.execute({
          apiId: apiId3,
          version: version3,
          operation: 'add',
          path: '/test',
          method: 'GET',
          operationObject: { summary: 'Duplicate' },
        })
      ).rejects.toThrow('already exists')

      // Try to update non-existent endpoint
      await expect(
        tool.execute({
          apiId: apiId3,
          version: version3,
          operation: 'update',
          path: '/nonexistent',
          method: 'GET',
          updates: { summary: 'Updated' },
        })
      ).rejects.toThrow('not found')

      // Try to delete non-existent endpoint
      await expect(
        tool.execute({
          apiId: apiId3,
          version: version3,
          operation: 'delete',
          path: '/nonexistent',
          method: 'GET',
        })
      ).rejects.toThrow('not found')
    })
  })
})

