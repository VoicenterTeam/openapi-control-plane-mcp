/**
 * Error Classes
 *
 * @description Custom error classes that extend the base Error class.
 * Because throwing generic errors is like yelling "HEY!" in a crowded room -
 * technically it works, but nobody knows what you want. 🗣️
 *
 * @module utils/errors
 */

import {
  ErrorType,
} from '../types/errors.js'

/**
 * Base custom error class
 * @description The parent of all our custom errors. Sets up common functionality.
 */
export class CustomError extends Error {
  public type: ErrorType
  public code?: string
  public details?: Record<string, unknown>
  public cause?: Error

  constructor(message: string, type: ErrorType, code?: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.code = code
    this.cause = cause
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation Error
 * @description Thrown when input doesn't pass validation. Like a bouncer
 * refusing entry because your ID expired in 1987.
 */
export class ValidationError extends CustomError {
  public field?: string
  public expected?: string
  public received?: string
  public rule?: string

  constructor(
    message: string,
    options?: {
      field?: string
      expected?: string
      received?: string
      rule?: string
      code?: string
      cause?: Error
    }
  ) {
    super(message, ErrorType.VALIDATION_ERROR, options?.code, options?.cause)
    this.field = options?.field
    this.expected = options?.expected
    this.received = options?.received
    this.rule = options?.rule
  }
}

/**
 * Storage Error
 * @description Thrown when file system operations fail. Because sometimes
 * the disk is full, the permissions are wrong, or Mercury is in retrograde.
 */
export class StorageError extends CustomError {
  public path?: string
  public operation?: 'read' | 'write' | 'delete' | 'list' | 'exists'

  constructor(
    message: string,
    options?: {
      path?: string
      operation?: 'read' | 'write' | 'delete' | 'list' | 'exists'
      code?: string
      cause?: Error
    }
  ) {
    super(message, ErrorType.STORAGE_ERROR, options?.code, options?.cause)
    this.path = options?.path
    this.operation = options?.operation
  }
}

/**
 * Tool Error
 * @description Thrown when an MCP tool fails during execution. When your tool
 * has an existential crisis mid-operation.
 */
export class ToolError extends CustomError {
  public tool_name?: string
  public params?: Record<string, unknown>

  constructor(
    message: string,
    options?: {
      tool_name?: string
      params?: Record<string, unknown>
      code?: string
      cause?: Error
    }
  ) {
    super(message, ErrorType.TOOL_ERROR, options?.code, options?.cause)
    this.tool_name = options?.tool_name
    this.params = options?.params
  }
}

/**
 * Reference Error
 * @description Thrown when a $ref can't be resolved. Like following a treasure
 * map where X actually marks nothing.
 */
export class ReferenceError extends CustomError {
  public ref_path?: string
  public location?: string

  constructor(
    message: string,
    options?: {
      ref_path?: string
      location?: string
      code?: string
      cause?: Error
    }
  ) {
    super(message, ErrorType.REFERENCE_ERROR, options?.code, options?.cause)
    this.ref_path = options?.ref_path
    this.location = options?.location
  }
}

/**
 * Creates a ValidationError with helpful details
 * @param message - Error message
 * @param field - Field that failed validation
 * @param expected - What was expected
 * @param received - What was actually received
 * @returns ValidationError instance
 * @description Factory function for creating validation errors. Because typing
 * out the whole constructor call is tedious.
 */
export function createValidationError(
  message: string,
  field?: string,
  expected?: string,
  received?: string
): ValidationError {
  return new ValidationError(message, { field, expected, received })
}

/**
 * Creates a StorageError with helpful details
 * @param message - Error message
 * @param path - Path that caused the error
 * @param operation - Operation that failed
 * @param cause - Original error
 * @returns StorageError instance
 * @description Factory function for storage errors. One-stop shop for disk disasters.
 */
export function createStorageError(
  message: string,
  path?: string,
  operation?: 'read' | 'write' | 'delete' | 'list' | 'exists',
  cause?: Error
): StorageError {
  return new StorageError(message, { path, operation, cause })
}

/**
 * Creates a ToolError with helpful details
 * @param message - Error message
 * @param toolName - Name of the tool that failed
 * @param params - Parameters that were provided
 * @param cause - Original error
 * @returns ToolError instance
 * @description Factory function for tool errors. When your tool misbehaves.
 */
export function createToolError(
  message: string,
  toolName?: string,
  params?: Record<string, unknown>,
  cause?: Error
): ToolError {
  return new ToolError(message, { tool_name: toolName, params, cause })
}

/**
 * Creates a ReferenceError with helpful details
 * @param message - Error message
 * @param refPath - The $ref path that couldn't be resolved
 * @param location - Where the reference was used
 * @returns ReferenceError instance
 * @description Factory function for reference errors. For when $refs go AWOL.
 */
export function createReferenceError(
  message: string,
  refPath?: string,
  location?: string
): ReferenceError {
  return new ReferenceError(message, { ref_path: refPath, location })
}

