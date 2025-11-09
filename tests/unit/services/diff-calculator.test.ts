/**
 * Tests for DiffCalculator
 */

import { DiffCalculator } from '../../../src/services/diff-calculator'
import type { OpenAPIV3 } from 'openapi-types'

describe('DiffCalculator', () => {
  let diffCalculator: DiffCalculator

  const baseSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          summary: 'Get users',
          responses: {
            '200': { description: 'Success' },
          },
        },
        post: {
          summary: 'Create user',
          responses: {
            '201': { description: 'Created' },
          },
        },
      },
      '/posts': {
        get: {
          summary: 'Get posts',
          responses: {
            '200': { description: 'Success' },
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
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
          },
        },
      },
    },
  }

  beforeEach(() => {
    diffCalculator = new DiffCalculator()
  })

  describe('calculateDiff', () => {
    it('should detect no changes when specs are identical', () => {
      const diff = diffCalculator.calculateDiff(baseSpec as any, baseSpec as any)

      expect(diff.summary.endpoints_added).toEqual([])
      expect(diff.summary.endpoints_deleted).toEqual([])
      expect(diff.summary.endpoints_modified).toEqual([])
      expect(diff.summary.schemas_added).toEqual([])
      expect(diff.summary.schemas_deleted).toEqual([])
      expect(diff.breaking_changes).toEqual([])
    })

    it('should detect added endpoints', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          ...baseSpec.paths,
          '/comments': {
            get: {
              summary: 'Get comments',
              responses: {
                '200': { description: 'Success' },
              },
            },
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.endpoints_added).toContain('get /comments')
      expect(diff.endpoints_added_detail).toContainEqual({
        path: '/comments',
        methods: ['get'],
      })
    })

    it('should detect removed endpoints', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          '/users': baseSpec.paths!['/users'],
          // /posts removed
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.endpoints_deleted).toContain('get /posts')
      expect(diff.endpoints_removed_detail).toContainEqual({
        path: '/posts',
        methods: ['get'],
      })
      expect(diff.breaking_changes).toContainEqual('Removed endpoint: get /posts')
    })

    it('should detect added methods on existing path', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          ...baseSpec.paths,
          '/posts': {
            ...(baseSpec.paths!['/posts'] as any),
            delete: {
              summary: 'Delete post',
              responses: {
                '204': { description: 'Deleted' },
              },
            },
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.endpoints_added).toContain('delete /posts')
    })

    it('should detect modified endpoints', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          ...baseSpec.paths,
          '/users': {
            get: {
              summary: 'Get all users', // Changed summary
              parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }], // Added param
              responses: {
                '200': { description: 'Success' },
              },
            },
            post: (baseSpec.paths!['/users'] as any).post,
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.endpoints_modified).toContain('GET /users')
      expect(diff.endpoints_modified_detail).toContainEqual({
        path: '/users',
        method: 'GET',
        changes: expect.arrayContaining(['summary changed', expect.stringContaining('parameters')]),
      })
    })

    it('should detect added schemas', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        components: {
          schemas: {
            ...baseSpec.components!.schemas,
            Comment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.schemas_added).toContain('Comment')
      expect(diff.schemas_added_detail).toContainEqual({
        name: 'Comment',
        type: 'object',
      })
    })

    it('should detect removed schemas', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        components: {
          schemas: {
            User: baseSpec.components!.schemas!.User,
            // Post removed
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.schemas_deleted).toContain('Post')
      expect(diff.schemas_removed_detail).toContainEqual({ name: 'Post' })
      expect(diff.breaking_changes).toContainEqual('Removed schema: Post')
    })

    it('should detect modified schemas', () => {
      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }, // Added property
              },
            },
            Post: baseSpec.components!.schemas!.Post,
          },
        },
      }

      const diff = diffCalculator.calculateDiff(baseSpec as any, newSpec as any)

      expect(diff.summary.schemas_modified).toContain('User')
      expect(diff.breaking_changes.some((bc) => bc.includes('User'))).toBe(true)
    })

    it('should detect breaking changes from request body removal', () => {
      const oldSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                  },
                },
              },
              responses: {
                '201': { description: 'Created' },
              },
            },
          },
        },
      }

      const newSpec: OpenAPIV3.Document = {
        ...baseSpec,
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              // requestBody removed
              responses: {
                '201': { description: 'Created' },
              },
            },
          },
        },
      }

      const diff = diffCalculator.calculateDiff(oldSpec as any, newSpec as any)

      expect(diff.breaking_changes.some((bc) => bc.includes('request body removed'))).toBe(true)
    })

    it('should handle specs without paths', () => {
      const emptySpec: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {},
      }

      const diff = diffCalculator.calculateDiff(emptySpec as any, baseSpec as any)

      expect(diff.summary.endpoints_added.length).toBeGreaterThan(0)
      expect(diff.summary.endpoints_deleted).toEqual([])
    })

    it('should handle specs without schemas', () => {
      const specWithoutSchemas: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: baseSpec.paths!,
      }

      const diff = diffCalculator.calculateDiff(specWithoutSchemas as any, baseSpec as any)

      expect(diff.summary.schemas_added.length).toBeGreaterThan(0)
      expect(diff.summary.schemas_deleted).toEqual([])
    })
  })
})

