/**
 * Edge Case Tests - Metadata Update Tool
 *
 * @description Tests edge cases, error scenarios, and boundary conditions
 */

import { MetadataUpdateTool } from '../../../src/tools/metadata-update-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('MetadataUpdateTool - Edge Cases', () => {
  let tool: MetadataUpdateTool
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

    tool = new MetadataUpdateTool(mockSpecManager, mockAuditLogger)
  })

  describe('Empty and null values', () => {
    it('should handle empty string updates', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0', description: 'Original' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          description: '',
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.description).toBe('')
    })

    it('should handle very long description', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const longDescription = 'A'.repeat(10000)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          description: longDescription,
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.description).toBe(longDescription)
    })

    it('should handle special characters in title', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Test API™ with émojis 🚀 and "quotes"',
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.title).toContain('🚀')
    })

    it('should handle Unicode characters', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: '日本語 API',
          description: 'Описание на русском',
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.title).toBe('日本語 API')
    })
  })

  describe('URL validation', () => {
    it('should reject invalid termsOfService URL', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          updates: {
            termsOfService: 'not-a-url',
          },
        })
      ).rejects.toThrow()
    })

    it('should accept valid HTTPS URLs', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          termsOfService: 'https://example.com/terms',
        },
      })

      expect(result.success).toBe(true)
    })

    it('should accept valid HTTP URLs', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          termsOfService: 'http://example.com/terms',
        },
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid contact URL', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          updates: {
            contact: {
              url: 'invalid-url',
            },
          },
        })
      ).rejects.toThrow()
    })

    it('should reject invalid license URL', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          updates: {
            license: {
              name: 'MIT',
              url: 'not-a-url',
            },
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Email validation', () => {
    it('should reject invalid email format', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          updates: {
            contact: {
              email: 'not-an-email',
            },
          },
        })
      ).rejects.toThrow()
    })

    it('should accept valid email formats', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const validEmails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'name.surname@company.io',
      ]

      for (const email of validEmails) {
        const result = await tool.execute({
          apiId,
          version,
          updates: {
            contact: { email },
          },
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Extension handling', () => {
    it('should handle numeric extension values', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            priority: 1,
            'x-rate-limit': 1000,
          },
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated['x-priority']).toBe(1)
      expect((result.data as any).updated['x-rate-limit']).toBe(1000)
    })

    it('should handle boolean extension values', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            internal: true,
            deprecated: false,
          },
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated['x-internal']).toBe(true)
      expect((result.data as any).updated['x-deprecated']).toBe(false)
    })

    it('should handle array extension values', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            tags: ['finance', 'internal', 'v2'],
            owners: ['team-a', 'team-b'],
          },
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated['x-tags']).toEqual(['finance', 'internal', 'v2'])
    })

    it('should handle object extension values', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            metadata: {
              team: 'platform',
              repo: 'api-specs',
              slack: '#api-support',
            },
          },
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated['x-metadata']).toEqual({
        team: 'platform',
        repo: 'api-specs',
        slack: '#api-support',
      })
    })
  })

  describe('Concurrent operations simulation', () => {
    it('should handle rapid successive updates', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: JSON.parse(JSON.stringify(spec)) } as any)

      const updates = [
        { title: 'Title 1' },
        { description: 'Description 1' },
        { version: '2.0.0' },
      ]

      for (const update of updates) {
        const result = await tool.execute({
          apiId,
          version,
          updates: update,
        })
        expect(result.success).toBe(true)
      }

      expect(mockSpecManager.saveSpec).toHaveBeenCalledTimes(3)
    })
  })

  describe('Storage failure scenarios', () => {
    it('should handle load failure gracefully', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Storage unavailable'))

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })

    it('should handle save failure gracefully', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)
      mockSpecManager.saveSpec.mockRejectedValue(new Error('Disk full'))

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })

    it('should handle audit log failure gracefully', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)
      mockAuditLogger.logEvent.mockRejectedValue(new Error('Audit log unavailable'))

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })
  })

  describe('Version tag edge cases', () => {
    it('should handle semantic versions', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const versions = ['v1.0.0', 'v2.3.4', 'v0.0.1', 'v10.20.30']

      for (const ver of versions) {
        const result = await tool.execute({
          apiId,
          version: ver,
          updates: { title: 'Test' },
        })
        expect(result.success).toBe(true)
      }
    })

    it('should handle timestamp versions', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const result = await tool.execute({
        apiId,
        version: 'v20250109-120000',
        updates: { title: 'Test' },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('API ID edge cases', () => {
    it('should handle various valid API ID formats', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec } as any)

      const validIds = ['api', 'my-api', 'api-v2', 'payment-api-2024']

      for (const id of validIds) {
        const result = await tool.execute({
          apiId: id,
          version,
          updates: { title: 'Test' },
        })
        expect(result.success).toBe(true)
      }
    })
  })
})

