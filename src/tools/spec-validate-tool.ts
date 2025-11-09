/**
 * Spec Validate Tool
 *
 * @description MCP tool for validating OpenAPI specifications using Spectral.
 * Finds all the things wrong with your API spec. Don't take it personally. 🔍
 *
 * @module tools/spec-validate-tool
 */

import { z } from 'zod'
import { BaseTool, BaseToolParams, ToolResult, ToolDescription } from '../types/mcp-tool.js'
import type { ValidationService } from '../services/validation-service.js'
import { createApiId, createVersionTag } from '../types/openapi.js'
import { createToolError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Parameters for spec_validate tool
 */
interface SpecValidateParams extends BaseToolParams {
  apiId: string
  version: string
  severityFilter?: 'error' | 'warning' | 'info' | 'hint'
  includeHints?: boolean
}

/**
 * Schema for spec_validate parameters
 */
const specValidateSchema = z.object({
  apiId: z.string().describe('API identifier'),
  version: z.string().describe('Version tag (e.g., v1.0.0)'),
  severityFilter: z
    .enum(['error', 'warning', 'info', 'hint'])
    .optional()
    .describe('Filter issues by minimum severity level'),
  includeHints: z
    .boolean()
    .optional()
    .describe('Whether to include hint-level issues (default: false)'),
  llmReason: z.string().optional().describe('Optional reason from LLM for this validation'),
})

/**
 * Spec Validate Tool
 * @description Validates OpenAPI specifications using Spectral. The spec quality inspector. 🔍✅
 */
export class SpecValidateTool extends BaseTool<SpecValidateParams> {
  private validationService: ValidationService

  /**
   * Creates a new spec validate tool
   * @param validationService - Validation service instance
   * @description Sets up the validation tool with the validation service
   */
  constructor(validationService: ValidationService) {
    super()
    this.validationService = validationService
  }

  /**
   * Executes the spec validation
   * @param params - Tool parameters
   * @returns Tool result with validation issues
   * @description Validates the spec and reports all issues. Truth hurts sometimes.
   */
  async execute(params: SpecValidateParams): Promise<ToolResult> {
    try {
      // Validate parameters
      const validated = this.validate(params, specValidateSchema)

      // Create branded types
      const apiId = createApiId(validated.apiId)
      const version = createVersionTag(validated.version)

      logger.info(
        { apiId, version, llmReason: validated.llmReason },
        'spec_validate tool executing'
      )

      // Validate the spec
      const result = await this.validationService.validateSpec(apiId, version)

      // Apply filters if specified
      let filteredIssues = result.issues
      const includeHints = validated.includeHints ?? false

      if (!includeHints) {
        filteredIssues = filteredIssues.filter((issue) => issue.severity !== 3) // 3 = HINT
      }

      if (validated.severityFilter) {
        const severityMap = {
          error: 0,
          warning: 1,
          info: 2,
          hint: 3,
        }
        const minSeverity = severityMap[validated.severityFilter]
        filteredIssues = filteredIssues.filter((issue) => issue.severity <= minSeverity)
      }

      // Format the result
      const summary = this.validationService.formatSummary(result)
      const message = result.valid
        ? `✅ Spec is valid! ${summary}`
        : `❌ Spec has issues: ${summary}`

      return this.success(message, {
        valid: result.valid,
        issueCount: filteredIssues.length,
        totalIssues: result.issueCount,
        summary: result.summary,
        issues: filteredIssues,
      })
    } catch (error) {
      logger.error({ error, params }, 'spec_validate tool failed')
      throw createToolError(
        (error as Error).message,
        'spec_validate',
        params as any,
        error as Error
      )
    }
  }

  /**
   * Returns the tool description for MCP registration
   * @returns Tool description
   * @description Tells the MCP server what this tool does
   */
  describe(): ToolDescription {
    return {
      name: 'spec_validate',
      description:
        'Validates OpenAPI specifications using Spectral. Reports errors, warnings, info, and hints. Helps ensure spec quality and best practices compliance.',
      inputSchema: specValidateSchema,
    }
  }
}

