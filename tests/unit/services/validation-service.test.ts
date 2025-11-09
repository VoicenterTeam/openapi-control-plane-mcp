/**
 * Tests for ValidationService
 */

import { ValidationService, ValidationSeverity } from '../../../src/services/validation-service'
import { SpecManager } from '../../../src/services/spec-manager'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import { createApiId, createVersionTag } from '../../../src/types/openapi'
import type { OpenAPIV3 } from 'openapi-types'

// Mock the storage and spec manager
jest.mock('../../../src/storage/file-system-storage')
jest.mock('../../../src/services/spec-manager')

describe('ValidationService', () => {
  let validationService: ValidationService
  let mockSpecManager: jest.Mocked<SpecManager>

  const validSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users': {
        get: {
          summary: 'Get users',
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  const invalidSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Invalid API',
      // Missing version field (required)
    },
    paths: {},
  }

  beforeEach(() => {
    const mockStorage = new FileSystemStorage({ basePath: '/data' }) as jest.Mocked<FileSystemStorage>
    mockSpecManager = new SpecManager(mockStorage) as jest.Mocked<SpecManager>
    validationService = new ValidationService(mockSpecManager)
  })

  describe('validateSpec', () => {
    it('should validate a valid spec successfully', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: validSpec } as any)

      const result = await validationService.validateSpec(
        createApiId('test-api'),
        createVersionTag('v1.0.0')
      )

      expect(result.valid).toBe(true)
      expect(result.summary.errors).toBe(0)
      // Spec may have warnings/hints, but should be valid (no errors)
      expect(result.issueCount).toBeGreaterThanOrEqual(0)
    })

    it('should detect errors in invalid spec', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: invalidSpec } as any)

      const result = await validationService.validateSpec(
        createApiId('test-api'),
        createVersionTag('v1.0.0')
      )

      expect(result.valid).toBe(false)
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.issueCount).toBeGreaterThan(0)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should categorize issues by severity', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: invalidSpec } as any)

      const result = await validationService.validateSpec(
        createApiId('test-api'),
        createVersionTag('v1.0.0')
      )

      expect(result.summary).toHaveProperty('errors')
      expect(result.summary).toHaveProperty('warnings')
      expect(result.summary).toHaveProperty('info')
      expect(result.summary).toHaveProperty('hints')
    })

    it('should include issue details', async () => {
      mockSpecManager.loadSpec.mockResolvedValue({ version: '3.0', spec: invalidSpec } as any)

      const result = await validationService.validateSpec(
        createApiId('test-api'),
        createVersionTag('v1.0.0')
      )

      const firstIssue = result.issues[0]
      expect(firstIssue).toHaveProperty('severity')
      expect(firstIssue).toHaveProperty('message')
      expect(firstIssue).toHaveProperty('path')
      expect(firstIssue).toHaveProperty('code')
    })

    it('should throw error if spec cannot be loaded', async () => {
      mockSpecManager.loadSpec.mockRejectedValue(new Error('Spec not found'))

      await expect(
        validationService.validateSpec(createApiId('missing-api'), createVersionTag('v1.0.0'))
      ).rejects.toThrow()
    })
  })

  describe('validateSpecObject', () => {
    it('should validate a spec object directly', async () => {
      const result = await validationService.validateSpecObject(validSpec, 'test-source')

      expect(result.valid).toBe(true)
      expect(result.summary.errors).toBe(0)
    })

    it('should detect errors in invalid spec object', async () => {
      const result = await validationService.validateSpecObject(invalidSpec, 'test-source')

      expect(result.valid).toBe(false)
      expect(result.summary.errors).toBeGreaterThan(0)
    })

    it('should use default source name if not provided', async () => {
      const result = await validationService.validateSpecObject(validSpec)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('issues')
    })
  })

  describe('formatSummary', () => {
    it('should format summary with no issues', () => {
      const result = {
        valid: true,
        issueCount: 0,
        summary: { errors: 0, warnings: 0, info: 0, hints: 0 },
        issues: [],
      }

      const summary = validationService.formatSummary(result)
      expect(summary).toContain('No issues')
    })

    it('should format summary with errors only', () => {
      const result = {
        valid: false,
        issueCount: 3,
        summary: { errors: 3, warnings: 0, info: 0, hints: 0 },
        issues: [],
      }

      const summary = validationService.formatSummary(result)
      expect(summary).toContain('3 errors')
    })

    it('should format summary with multiple severity levels', () => {
      const result = {
        valid: false,
        issueCount: 10,
        summary: { errors: 2, warnings: 5, info: 2, hints: 1 },
        issues: [],
      }

      const summary = validationService.formatSummary(result)
      expect(summary).toContain('2 errors')
      expect(summary).toContain('5 warnings')
      expect(summary).toContain('2 info')
      expect(summary).toContain('1 hint')
    })

    it('should use plural forms correctly', () => {
      const result = {
        valid: false,
        issueCount: 2,
        summary: { errors: 1, warnings: 1, info: 0, hints: 0 },
        issues: [],
      }

      const summary = validationService.formatSummary(result)
      // Should include "1 error" and "1 warning"
      expect(summary).toContain('1 error')
      expect(summary).toContain('1 warning')
    })
  })

  describe('ValidationSeverity enum', () => {
    it('should have correct severity levels', () => {
      expect(ValidationSeverity.ERROR).toBe(0)
      expect(ValidationSeverity.WARNING).toBe(1)
      expect(ValidationSeverity.INFO).toBe(2)
      expect(ValidationSeverity.HINT).toBe(3)
    })
  })
})

