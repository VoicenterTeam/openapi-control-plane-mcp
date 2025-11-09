/**
 * Tests for MetadataUpdateTool
 */

import { MetadataUpdateTool } from '../../../src/tools/metadata-update-tool'
import { SpecManager } from '../../../src/services/spec-manager'
import { AuditLogger } from '../../../src/services/audit-logger'
import { createApiId, createVersionTag } from '../../../src/types/openapi'

// Mock dependencies
jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/services/audit-logger')

describe('MetadataUpdateTool', () => {
  let tool: MetadataUpdateTool
  let mockSpecManager: jest.Mocked<SpecManager>
  let mockAuditLogger: jest.Mocked<AuditLogger>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const sampleSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'Original description',
      contact: {
        name: 'Original Contact',
        email: 'original@example.com',
      },
      license: {
        name: 'MIT',
      },
    },
    paths: {},
  }

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

  describe('execute', () => {
    it('should update title', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Updated API Title',
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.title).toBe('Updated API Title')
      expect(mockSpecManager.saveSpec).toHaveBeenCalled()
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          api_id: apiId,
          version,
          event: 'metadata_update',
          user: 'system',
          details: expect.objectContaining({
            action: 'update_info',
          }),
        })
      )
    })

    it('should update description', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          description: 'New description with more details',
        },
      })

      expect(result.success).toBe(true)
      expect((result.data as any).updated.description).toBe('New description with more details')
    })

    it('should update contact information', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          contact: {
            name: 'New Contact',
            email: 'new@example.com',
            url: 'https://example.com',
          },
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.contact.name).toBe('New Contact')
      expect(updated.contact.email).toBe('new@example.com')
      expect(updated.contact.url).toBe('https://example.com')
    })

    it('should update license information', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          license: {
            name: 'Apache 2.0',
            url: 'https://www.apache.org/licenses/LICENSE-2.0',
          },
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.license.name).toBe('Apache 2.0')
      expect(updated.license.url).toBe('https://www.apache.org/licenses/LICENSE-2.0')
    })

    it('should update multiple fields at once', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Updated Title',
          description: 'Updated Description',
          version: '2.0.0',
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.title).toBe('Updated Title')
      expect(updated.description).toBe('Updated Description')
      expect(updated.version).toBe('2.0.0')
    })

    it('should add custom x- extensions', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          extensions: {
            logo: 'https://example.com/logo.png',
            category: 'payment',
            'x-internal': true,
          },
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated['x-logo']).toBe('https://example.com/logo.png')
      expect(updated['x-category']).toBe('payment')
      expect(updated['x-internal']).toBe(true)
    })

    it('should preserve existing fields not being updated', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'New Title',
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.description).toBe('Original description')
      expect(updated.contact.name).toBe('Original Contact')
      expect(updated.license.name).toBe('MIT')
    })

    it('should include llmReason in audit log', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      await tool.execute({
        apiId,
        version,
        updates: {
          title: 'Updated Title',
        },
        llmReason: 'User requested title change for clarity',
      })

      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          api_id: apiId,
          version,
          event: 'metadata_update',
          user: 'system',
          llm_reason: 'User requested title change for clarity',
        })
      )
    })

    it('should summarize changes correctly', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          title: 'New Title',
          description: 'New Description',
        },
      })

      expect(result.success).toBe(true)
      const changes = (result.data as any).changes
      expect(changes.title).toEqual({
        from: 'Test API',
        to: 'New Title',
      })
      expect(changes.description).toEqual({
        from: 'Original description',
        to: 'New Description',
      })
    })

    it('should throw error for invalid API ID', async () => {
      await expect(
        tool.execute({
          apiId: 'invalid id with spaces',
          version,
          updates: { title: 'New Title' },
        } as any)
      ).rejects.toThrow()
    })

    it('should throw error for invalid version', async () => {
      await expect(
        tool.execute({
          apiId,
          version: 'invalid',
          updates: { title: 'New Title' },
        } as any)
      ).rejects.toThrow()
    })

    it('should throw error if spec has no info section', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: { openapi: '3.0.0', paths: {} },
      } as any)

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow('does not have an info section')
    })

    it('should throw error if spec load fails', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Load failed'))

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })

    it('should throw error if spec save fails', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)
      mockSpecManager.saveSpec.mockRejectedValue(new Error('Save failed'))

      await expect(
        tool.execute({
          apiId,
          version,
          updates: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })

    it('should handle partial contact updates', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          contact: {
            url: 'https://newurl.com',
          },
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.contact.name).toBe('Original Contact')
      expect(updated.contact.email).toBe('original@example.com')
      expect(updated.contact.url).toBe('https://newurl.com')
    })

    it('should handle partial license updates', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({
        version: '3.0',
        spec: JSON.parse(JSON.stringify(sampleSpec)),
      } as any)

      const result = await tool.execute({
        apiId,
        version,
        updates: {
          license: {
            url: 'https://opensource.org/licenses/MIT',
          },
        },
      })

      expect(result.success).toBe(true)
      const updated = (result.data as any).updated
      expect(updated.license.name).toBe('MIT')
      expect(updated.license.url).toBe('https://opensource.org/licenses/MIT')
    })
  })

  describe('describe', () => {
    it('should return correct tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('metadata_update')
      expect(description.description).toContain('metadata')
      expect(description.description).toContain('info')
      expect(description.inputSchema).toBeDefined()
    })
  })
})

