/**
 * Error Type Definitions
 *
 * @description Custom error types for the MCP server. Because generic errors are
 * about as helpful as "something went wrong" - which is to say, not at all. 💥
 *
 * @module types/errors
 */

/**
 * Error type enumeration
 * @description Categories of errors that can occur. Like organizing your sock drawer,
 * but for failures.
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TOOL_ERROR = 'TOOL_ERROR',
  REFERENCE_ERROR = 'REFERENCE_ERROR',
  VERSION_ERROR = 'VERSION_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Base error interface for all custom errors
 * @description The foundation upon which all our beautiful errors are built
 */
export interface BaseError {
  /** Error type for categorization */
  type: ErrorType
  /** Human-readable error message */
  message: string
  /** Optional error code for programmatic handling */
  code?: string
  /** Additional context details */
  details?: Record<string, unknown>
  /** Original error that caused this one (if any) */
  cause?: Error
  /** Stack trace for debugging */
  stack?: string
}

/**
 * Validation error details
 * @description For when your input doesn't pass the vibe check
 */
export interface ValidationErrorDetails extends BaseError {
  type: ErrorType.VALIDATION_ERROR
  /** Field that failed validation */
  field?: string
  /** Expected value or format */
  expected?: string
  /** Actual value that was provided */
  received?: string
  /** Validation rule that was violated */
  rule?: string
}

/**
 * Storage error details
 * @description For when the file system betrays us
 */
export interface StorageErrorDetails extends BaseError {
  type: ErrorType.STORAGE_ERROR
  /** Path that caused the error */
  path?: string
  /** Operation that failed (read, write, delete, etc.) */
  operation?: 'read' | 'write' | 'delete' | 'list' | 'exists'
}

/**
 * Tool execution error details
 * @description For when an MCP tool has a bad day
 */
export interface ToolErrorDetails extends BaseError {
  type: ErrorType.TOOL_ERROR
  /** Name of the tool that failed */
  tool_name?: string
  /** Parameters that were provided */
  params?: Record<string, unknown>
}

/**
 * Reference resolution error details
 * @description For when $refs go on vacation and can't be found
 */
export interface ReferenceErrorDetails extends BaseError {
  type: ErrorType.REFERENCE_ERROR
  /** The reference path that couldn't be resolved */
  ref_path?: string
  /** Location where the reference was used */
  location?: string
}

/**
 * Serializes an error to a plain object
 * @param error - Error to serialize
 * @returns Plain object representation
 * @description Converts errors to JSON-friendly format for logging and API responses
 */
export function serializeError(error: Error | BaseError): Record<string, unknown> {
  const serialized: Record<string, unknown> = {
    message: error.message,
    stack: error.stack,
  }

  // Include all custom properties
  if ('type' in error) {
    serialized.type = error.type
  }
  if ('code' in error) {
    serialized.code = error.code
  }
  if ('details' in error) {
    serialized.details = error.details
  }
  if ('cause' in error && error.cause && error.cause instanceof Error) {
    serialized.cause = serializeError(error.cause)
  }

  return serialized
}

