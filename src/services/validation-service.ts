/**
 * Validation Service
 *
 * @description Uses Spectral to validate OpenAPI specifications with style.
 * Like a strict English teacher, but for API specs. Red pen included. 📝✅
 *
 * @module services/validation-service
 */

import type { ISpectralDiagnostic, RulesetDefinition } from '@stoplight/spectral-core'
import type { ApiId, VersionTag } from '../types/openapi.js'
import type { SpecManager } from './spec-manager.js'
import { logger } from '../utils/logger.js'
import { createValidationError } from '../utils/errors.js'

// Dynamic imports for CommonJS modules to handle both Node runtime and Jest
let Spectral: any
let oas: any

async function loadSpectralDependencies() {
  if (!Spectral) {
    const SpectralCore = await import('@stoplight/spectral-core')
    const SpectralRulesets = await import('@stoplight/spectral-rulesets')
    Spectral = (SpectralCore as any).Spectral || (SpectralCore as any).default?.Spectral
    oas = (SpectralRulesets as any).oas || (SpectralRulesets as any).default?.oas
  }
  return { Spectral, oas }
}

/**
 * Validation severity levels
 * @description How badly you messed up, in order of increasing panic
 */
export enum ValidationSeverity {
  ERROR = 0,
  WARNING = 1,
  INFO = 2,
  HINT = 3,
}

/**
 * A single validation issue found in the spec
 * @description One item on the list of things you need to fix
 */
export interface ValidationIssue {
  /** Severity level (error, warning, info, hint) */
  severity: ValidationSeverity
  /** Human-readable error message */
  message: string
  /** JSONPath to the problematic location */
  path: string[]
  /** The rule that was violated */
  code: string
  /** Line number in source (if available) */
  line?: number
  /** Column number in source (if available) */
  column?: number
}

/**
 * Result of validating a spec
 * @description The report card for your API specification
 */
export interface ValidationResult {
  /** Whether the spec is valid (no errors) */
  valid: boolean
  /** Total number of issues found */
  issueCount: number
  /** Breakdown by severity */
  summary: {
    errors: number
    warnings: number
    info: number
    hints: number
  }
  /** All validation issues */
  issues: ValidationIssue[]
}

/**
 * Validation Service
 * @description Validates OpenAPI specs using Spectral. The spec police. 👮
 */
export class ValidationService {
  private spectral: any
  private specManager: SpecManager
  private initialized: Promise<void>

  /**
   * Creates a new validation service
   * @param specManager - SpecManager instance for loading specs
   * @description Sets up the validation engine with OpenAPI rulesets
   */
  constructor(specManager: SpecManager) {
    this.specManager = specManager
    this.initialized = this.initialize()
  }

  /**
   * Initialize Spectral with dependencies
   * @description Loads Spectral dependencies and sets up rulesets
   */
  private async initialize(): Promise<void> {
    const deps = await loadSpectralDependencies()
    this.spectral = new deps.Spectral()
    await this.setupDefaultRuleset()
  }

  /**
   * Sets up the default OpenAPI ruleset
   * @description Loads Spectral's built-in OpenAPI rules. The standard playbook.
   */
  private async setupDefaultRuleset(): Promise<void> {
    const deps = await loadSpectralDependencies()
    try {
      this.spectral.setRuleset(deps.oas as RulesetDefinition)
      logger.info('Validation service initialized with OAS ruleset')
    } catch (error) {
      logger.error({ error }, 'Failed to initialize validation ruleset')
      throw error
    }
  }

  /**
   * Validates an OpenAPI specification
   * @param apiId - API identifier
   * @param version - Version tag
   * @returns Validation result with all issues found
   * @description Runs the spec through Spectral and reports back. Brutally honest.
   */
  async validateSpec(apiId: ApiId, version: VersionTag): Promise<ValidationResult> {
    await this.initialized // Ensure Spectral is loaded
    try {
      logger.info({ apiId, version }, 'Starting spec validation')

      // Load the spec
      const { spec } = await this.specManager.loadSpec(apiId, version)

      // Run validation (Spectral accepts plain objects)
      const diagnostics = await this.spectral.run(spec as any)

      // Transform diagnostics to our format
      const issues = this.transformDiagnostics(diagnostics)

      // Calculate summary
      const summary = {
        errors: issues.filter((i) => i.severity === ValidationSeverity.ERROR).length,
        warnings: issues.filter((i) => i.severity === ValidationSeverity.WARNING).length,
        info: issues.filter((i) => i.severity === ValidationSeverity.INFO).length,
        hints: issues.filter((i) => i.severity === ValidationSeverity.HINT).length,
      }

      const valid = summary.errors === 0
      const issueCount = issues.length

      logger.info({ apiId, version, valid, issueCount, summary }, 'Spec validation completed')

      return {
        valid,
        issueCount,
        summary,
        issues,
      }
    } catch (error) {
      logger.error({ error, apiId, version }, 'Spec validation failed')
      throw createValidationError(
        `Failed to validate spec: ${(error as Error).message}`,
        'spec'
      )
    }
  }

  /**
   * Validates a spec object directly (without loading from storage)
   * @param spec - OpenAPI specification object
   * @param source - Optional source identifier for logging
   * @returns Validation result
   * @description Validates a spec that's already in memory. Drive-by validation.
   */
  async validateSpecObject(spec: object, source = 'memory'): Promise<ValidationResult> {
    await this.initialized // Ensure Spectral is loaded
    try {
      logger.info({ source }, 'Starting spec object validation')

      // Run validation (Spectral accepts plain objects)
      const diagnostics = await this.spectral.run(spec as any)

      // Transform diagnostics to our format
      const issues = this.transformDiagnostics(diagnostics)

      // Calculate summary
      const summary = {
        errors: issues.filter((i) => i.severity === ValidationSeverity.ERROR).length,
        warnings: issues.filter((i) => i.severity === ValidationSeverity.WARNING).length,
        info: issues.filter((i) => i.severity === ValidationSeverity.INFO).length,
        hints: issues.filter((i) => i.severity === ValidationSeverity.HINT).length,
      }

      const valid = summary.errors === 0
      const issueCount = issues.length

      logger.info({ source, valid, issueCount, summary }, 'Spec object validation completed')

      return {
        valid,
        issueCount,
        summary,
        issues,
      }
    } catch (error) {
      logger.error({ error, source }, 'Spec object validation failed')
      throw createValidationError(
        `Failed to validate spec object: ${(error as Error).message}`,
        'spec'
      )
    }
  }

  /**
   * Transforms Spectral diagnostics to our ValidationIssue format
   * @param diagnostics - Raw Spectral diagnostics
   * @returns Array of validation issues
   * @description Converts Spectral's format to something more palatable
   */
  private transformDiagnostics(diagnostics: ISpectralDiagnostic[]): ValidationIssue[] {
    return diagnostics.map((diagnostic) => ({
      severity: diagnostic.severity as unknown as ValidationSeverity,
      message: diagnostic.message,
      path: (diagnostic.path || []).map(String),
      code: diagnostic.code as string,
      line: diagnostic.range?.start?.line,
      column: diagnostic.range?.start?.character,
    }))
  }

  /**
   * Applies a custom ruleset to Spectral
   * @param ruleset - Custom Spectral ruleset
   * @description For when you want to enforce your own special rules. House rules apply.
   */
  async setCustomRuleset(ruleset: RulesetDefinition): Promise<void> {
    try {
      this.spectral.setRuleset(ruleset)
      logger.info('Custom ruleset applied to validation service')
    } catch (error) {
      logger.error({ error }, 'Failed to apply custom ruleset')
      throw createValidationError(
        `Failed to apply custom ruleset: ${(error as Error).message}`,
        'ruleset'
      )
    }
  }

  /**
   * Gets statistics about validation issues by severity
   * @param result - Validation result
   * @returns Formatted statistics string
   * @description Creates a nice summary. The TL;DR of your mistakes.
   */
  formatSummary(result: ValidationResult): string {
    const { summary } = result
    const parts = []

    if (summary.errors > 0) parts.push(`${summary.errors} error${summary.errors > 1 ? 's' : ''}`)
    if (summary.warnings > 0)
      parts.push(`${summary.warnings} warning${summary.warnings > 1 ? 's' : ''}`)
    if (summary.info > 0) parts.push(`${summary.info} info`)
    if (summary.hints > 0) parts.push(`${summary.hints} hint${summary.hints > 1 ? 's' : ''}`)

    if (parts.length === 0) return 'No issues found ✨'

    return parts.join(', ')
  }
}

