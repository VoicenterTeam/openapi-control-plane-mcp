/**
 * Tests for SpecValidateTool
 */

import { SpecValidateTool } from '../../../src/tools/spec-validate-tool'
import { ValidationService, ValidationSeverity } from '../../../src/services/validation-service'
import { SpecManager } from '../../../src/services/spec-manager'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import type { ValidationResult } from '../../../src/services/validation-service'

// Mock dependencies
jest.mock('../../../src/services/validation-service')
jest.mock('../../../src/services/spec-manager')
jest.mock('../../../src/storage/file-system-storage')

describe('SpecValidateTool', () => {
  let tool: SpecValidateTool
  let mockValidationService: jest.Mocked<ValidationService>

  const validResult: ValidationResult = {
    valid: true,
    issueCount: 0,
    summary: { errors: 0, warnings: 0, info: 0, hints: 0 },
    issues: [],
  }

  const invalidResult: ValidationResult = {
    valid: false,
    issueCount: 5,
    summary: { errors: 2, warnings: 2, info: 1, hints: 0 },
    issues: [
      {
        severity: ValidationSeverity.ERROR,
        message: 'Missing required field: version',
        path: ['info'],
        code: 'info-version',
      },
      {
        severity: ValidationSeverity.ERROR,
        message: 'Path must start with /',
        path: ['paths', 'users'],
        code: 'path-keys-no-trailing-slash',
      },
      {
        severity: ValidationSeverity.WARNING,
        message: 'Operation should have summary',
        path: ['paths', '/users', 'get'],
        code: 'operation-summary',
      },
      {
        severity: ValidationSeverity.WARNING,
        message: 'Operation should have description',
        path: ['paths', '/users', 'get'],
        code: 'operation-description',
      },
      {
        severity: ValidationSeverity.INFO,
        message: 'Consider adding examples',
        path: ['paths', '/users', 'get', 'responses', '200'],
        code: 'examples',
      },
    ],
  }

  const resultWithHints: ValidationResult = {
    valid: true,
    issueCount: 2,
    summary: { errors: 0, warnings: 0, info: 0, hints: 2 },
    issues: [
      {
        severity: ValidationSeverity.HINT,
        message: 'Consider adding tags',
        path: ['paths', '/users', 'get'],
        code: 'operation-tags',
      },
      {
        severity: ValidationSeverity.HINT,
        message: 'Consider adding operationId',
        path: ['paths', '/users', 'get'],
        code: 'operation-operationId',
      },
    ],
  }

  beforeEach(() => {
    const mockStorage = new FileSystemStorage({ basePath: '/data' }) as jest.Mocked<FileSystemStorage>
    const mockSpecManager = new SpecManager(mockStorage) as jest.Mocked<SpecManager>
    mockValidationService = new ValidationService(
      mockSpecManager
    ) as jest.Mocked<ValidationService>

    mockValidationService.formatSummary = jest.fn((result) => {
      if (result.issueCount === 0) return 'No issues found ✨'
      const { summary } = result
      const parts = []
      if (summary.errors > 0) parts.push(`${summary.errors} errors`)
      if (summary.warnings > 0) parts.push(`${summary.warnings} warnings`)
      if (summary.info > 0) parts.push(`${summary.info} info`)
      if (summary.hints > 0) parts.push(`${summary.hints} hints`)
      return parts.join(', ')
    })

    tool = new SpecValidateTool(mockValidationService)
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('spec_validate')
      expect(description.description).toContain('Validates OpenAPI')
      expect(description.inputSchema).toBeDefined()
    })
  })

  describe('execute', () => {
    it('should validate a valid spec successfully', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.valid).toBe(true)
      expect((result.data as any)?.issueCount).toBe(0)
      expect(mockValidationService.validateSpec).toHaveBeenCalledWith('test-api', 'v1.0.0')
    })

    it('should report validation errors', async () => {
      mockValidationService.validateSpec.mockResolvedValue(invalidResult)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.valid).toBe(false)
      expect((result.data as any)?.issueCount).toBe(5)
      expect((result.data as any)?.issues).toHaveLength(5)
      expect((result.data as any)?.summary).toEqual(invalidResult.summary)
    })

    it('should filter out hints by default', async () => {
      mockValidationService.validateSpec.mockResolvedValue(resultWithHints)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.issueCount).toBe(0) // Hints filtered out
      expect((result.data as any)?.totalIssues).toBe(2) // Total before filtering
    })

    it('should include hints when requested', async () => {
      mockValidationService.validateSpec.mockResolvedValue(resultWithHints)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        includeHints: true,
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.issueCount).toBe(2) // Hints included
      expect((result.data as any)?.issues).toHaveLength(2)
    })

    it('should filter by severity level', async () => {
      mockValidationService.validateSpec.mockResolvedValue(invalidResult)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        severityFilter: 'error',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.issueCount).toBe(2) // Only errors
      expect((result.data as any)?.issues.every((i: any) => i.severity === 0)).toBe(true)
    })

    it('should filter warnings and above', async () => {
      mockValidationService.validateSpec.mockResolvedValue(invalidResult)

      const result = await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        severityFilter: 'warning',
      })

      expect(result.success).toBe(true)
      expect((result.data as any)?.issueCount).toBe(4) // Errors + warnings
    })

    it('should include llmReason in logging', async () => {
      mockValidationService.validateSpec.mockResolvedValue(validResult)

      await tool.execute({
        apiId: 'test-api',
        version: 'v1.0.0',
        llmReason: 'User requested validation before deployment',
      })

      expect(mockValidationService.validateSpec).toHaveBeenCalled()
    })

    it('should throw ToolError on validation service failure', async () => {
      mockValidationService.validateSpec.mockRejectedValue(new Error('Service error'))

      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'v1.0.0',
        })
      ).rejects.toThrow()
    })

    it('should validate apiId format', async () => {
      await expect(
        tool.execute({
          apiId: 'Invalid API',
          version: 'v1.0.0',
        })
      ).rejects.toThrow()
    })

    it('should validate version format', async () => {
      await expect(
        tool.execute({
          apiId: 'test-api',
          version: 'invalid',
        })
      ).rejects.toThrow()
    })
  })
})

