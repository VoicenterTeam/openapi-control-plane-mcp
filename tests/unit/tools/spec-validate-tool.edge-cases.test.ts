/**
 * Edge Case Tests - Spec Validate Tool
 *
 * @description Additional comprehensive tests for validation edge cases
 */

import { SpecValidateTool } from '../../../src/tools/spec-validate-tool'
import { ValidationService, ValidationSeverity } from '../../../src/services/validation-service'
import { SpecManager } from '../../../src/services/spec-manager'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import type { ValidationResult } from '../../../src/services/validation-service'

jest.mock('../../../src/services/validation-service')
jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/storage/file-system-storage')

describe('SpecValidateTool - Edge Cases', () => {
  let tool: SpecValidateTool
  let mockValidationService: jest.Mocked<ValidationService>

  beforeEach(() => {
    const mockStorage = new FileSystemStorage({ basePath: '/data' }) as jest.Mocked<FileSystemStorage>
    const mockSpecManager = new SpecManager(mockStorage) as jest.Mocked<SpecManager>
    mockValidationService = new ValidationService(mockSpecManager) as jest.Mocked<ValidationService>

    mockValidationService.formatSummary = jest.fn((result) => {
      if (result.issueCount === 0) return 'No issues found ✨'
      const { summary } = result
      const parts = []
      if (summary.errors > 0) parts.push(`${summary.errors} error${summary.errors > 1 ? 's' : ''}`)
      if (summary.warnings > 0)
        parts.push(`${summary.warnings} warning${summary.warnings > 1 ? 's' : ''}`)
      if (summary.info > 0) parts.push(`${summary.info} info`)
      if (summary.hints > 0) parts.push(`${summary.hints} hint${summary.hints > 1 ? 's' : ''}`)
      return parts.join(', ')
    })

    tool = new SpecValidateTool(mockValidationService)
  })

  describe('Large validation results', () => {
    it('should handle spec with many validation issues', async () => {
      const issues = Array.from({ length: 100 }, (_, i) => ({
        severity: ValidationSeverity.WARNING,
        message: `Issue ${i + 1}`,
        path: ['paths', `/endpoint${i}`, 'get'],
        code: `issue-${i}`,
      }))

      const result: ValidationResult = {
        valid: true,
        issueCount: 100,
        summary: { errors: 0, warnings: 100, info: 0, hints: 0 },
        issues,
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issues).toHaveLength(100)
    })

    it('should handle spec with no issues but large API ID', async () => {
      const result: ValidationResult = {
        valid: true,
        issueCount: 0,
        summary: { errors: 0, warnings: 0, info: 0, hints: 0 },
        issues: [],
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'large-api-with-many-endpoints-and-schemas',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issueCount).toBe(0)
    })
  })

  describe('Severity filtering combinations', () => {
    const mixedResult: ValidationResult = {
      valid: false,
      issueCount: 10,
      summary: { errors: 3, warnings: 4, info: 2, hints: 1 },
      issues: [
        {
          severity: ValidationSeverity.ERROR,
          message: 'Error 1',
          path: ['info'],
          code: 'error-1',
        },
        {
          severity: ValidationSeverity.ERROR,
          message: 'Error 2',
          path: ['paths'],
          code: 'error-2',
        },
        {
          severity: ValidationSeverity.ERROR,
          message: 'Error 3',
          path: ['components'],
          code: 'error-3',
        },
        {
          severity: ValidationSeverity.WARNING,
          message: 'Warning 1',
          path: ['paths', '/test'],
          code: 'warning-1',
        },
        {
          severity: ValidationSeverity.WARNING,
          message: 'Warning 2',
          path: ['paths', '/test'],
          code: 'warning-2',
        },
        {
          severity: ValidationSeverity.WARNING,
          message: 'Warning 3',
          path: ['paths', '/test'],
          code: 'warning-3',
        },
        {
          severity: ValidationSeverity.WARNING,
          message: 'Warning 4',
          path: ['paths', '/test'],
          code: 'warning-4',
        },
        {
          severity: ValidationSeverity.INFO,
          message: 'Info 1',
          path: ['paths', '/test'],
          code: 'info-1',
        },
        {
          severity: ValidationSeverity.INFO,
          message: 'Info 2',
          path: ['paths', '/test'],
          code: 'info-2',
        },
        {
          severity: ValidationSeverity.HINT,
          message: 'Hint 1',
          path: ['paths', '/test'],
          code: 'hint-1',
        },
      ],
    }

    it('should filter only errors', async () => {
      mockValidationService.validateSpec.mockResolvedValue(mixedResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        severityFilter: 'error',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issueCount).toBe(3)
      expect(
        (toolResult.data as any)?.issues.every((i: any) => i.severity === ValidationSeverity.ERROR)
      ).toBe(true)
    })

    it('should filter info and above', async () => {
      mockValidationService.validateSpec.mockResolvedValue(mixedResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        severityFilter: 'info',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issueCount).toBe(9) // All except hints
    })

    it('should include hints when explicitly requested', async () => {
      mockValidationService.validateSpec.mockResolvedValue(mixedResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        includeHints: true,
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issueCount).toBe(10)
      expect((toolResult.data as any)?.issues).toHaveLength(10)
    })
  })

  describe('API ID and version variations', () => {
    const validResult: ValidationResult = {
      valid: true,
      issueCount: 0,
      summary: { errors: 0, warnings: 0, info: 0, hints: 0 },
      issues: [],
    }

    it('should handle single character API ID', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const toolResult = await tool.execute({
        apiId: 'a',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
    })

    it('should handle hyphenated API IDs', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const toolResult = await tool.execute({
        apiId: 'my-super-long-api-id-with-many-hyphens',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
    })

    it('should handle v0.0.1 version', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v0.0.1',
      })

      expect(toolResult.success).toBe(true)
    })

    it('should handle large version numbers', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v99.99.99',
      })

      expect(toolResult.success).toBe(true)
    })

    it('should handle timestamp-based versions', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v20250109-120000',
      })

      expect(toolResult.success).toBe(true)
    })
  })

  describe('Error message formatting', () => {
    it('should handle issues with empty paths', async () => {
      const result: ValidationResult = {
        valid: false,
        issueCount: 1,
        summary: { errors: 1, warnings: 0, info: 0, hints: 0 },
        issues: [
          {
            severity: ValidationSeverity.ERROR,
            message: 'Global error',
            path: [],
            code: 'global-error',
          },
        ],
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issues[0].path).toEqual([])
    })

    it('should handle issues with very deep paths', async () => {
      const result: ValidationResult = {
        valid: false,
        issueCount: 1,
        summary: { errors: 0, warnings: 1, info: 0, hints: 0 },
        issues: [
          {
            severity: ValidationSeverity.WARNING,
            message: 'Deep path issue',
            path: ['paths', '/users', 'post', 'requestBody', 'content', 'application/json', 'schema', 'properties', 'address', 'properties', 'street'],
            code: 'deep-path',
          },
        ],
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issues[0].path.length).toBeGreaterThan(5)
    })
  })

  describe('Performance and stress scenarios', () => {
    it('should handle validation service timeout gracefully', async () => {
      mockValidationService.validateSpec.mockRejectedValue(new Error('Timeout after 30s'))

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
        })
      ).rejects.toThrow('Timeout')
    })

    it('should handle memory-intensive validation', async () => {
      // Simulate a huge result
      const hugeResult: ValidationResult = {
        valid: true,
        issueCount: 1000,
        summary: { errors: 0, warnings: 1000, info: 0, hints: 0 },
        issues: Array.from({ length: 1000 }, (_, i) => ({
          severity: ValidationSeverity.WARNING,
          message: `Warning ${i}`,
          path: ['paths', `/endpoint-${i}`, 'get'],
          code: `code-${i}`,
        })),
      }

      mockValidationService.validateSpec.mockResolvedValue(hugeResult)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      expect((toolResult.data as any)?.issueCount).toBe(1000)
    })
  })

  describe('Format summary edge cases', () => {
    it('should format summary with singular counts', async () => {
      const result: ValidationResult = {
        valid: false,
        issueCount: 2,
        summary: { errors: 1, warnings: 1, info: 0, hints: 0 },
        issues: [
          {
            severity: ValidationSeverity.ERROR,
            message: 'Error',
            path: [],
            code: 'error',
          },
          {
            severity: ValidationSeverity.WARNING,
            message: 'Warning',
            path: [],
            code: 'warning',
          },
        ],
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      const formattedSummary = mockValidationService.formatSummary(result)
      expect(formattedSummary).toContain('error')
      expect(formattedSummary).toContain('warning')
    })

    it('should format summary with no issues', async () => {
      const result: ValidationResult = {
        valid: true,
        issueCount: 0,
        summary: { errors: 0, warnings: 0, info: 0, hints: 0 },
        issues: [],
      }

      mockValidationService.validateSpec.mockResolvedValue(result)

      const toolResult = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(toolResult.success).toBe(true)
      const formattedSummary = mockValidationService.formatSummary(result)
      expect(formattedSummary).toContain('No issues')
    })
  })
})

