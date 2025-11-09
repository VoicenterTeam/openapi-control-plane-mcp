/**
 * Validation Utilities
 *
 * @description Helper functions for common validation tasks. Because regex
 * is like writing in ancient hieroglyphics - you know it works, but you're
 * not entirely sure how. 🔍
 *
 * @module utils/validation
 */

import { ValidationError } from './errors.js'
import type { ApiId, VersionTag } from '../types/openapi.js'
import { createApiId, createVersionTag } from '../types/openapi.js'

/**
 * Validates an API ID format
 * @param id - String to validate as API ID
 * @returns The validated and branded API ID
 * @throws ValidationError if format is invalid
 * @description Checks if a string looks like a valid API ID (lowercase alphanumeric with hyphens).
 * Like checking if someone's password is actually secure, but for identifiers.
 */
export function validateApiId(id: unknown): ApiId {
  if (typeof id !== 'string') {
    throw new ValidationError('API ID must be a string', {
      field: 'apiId',
      expected: 'string',
      received: typeof id,
    })
  }

  try {
    return createApiId(id)
  } catch (error) {
    throw new ValidationError(`Invalid API ID: ${id}`, {
      field: 'apiId',
      rule: 'Must be lowercase alphanumeric with hyphens',
      received: id,
    })
  }
}

/**
 * Validates a version tag format
 * @param version - String to validate as version tag
 * @returns The validated and branded version tag
 * @throws ValidationError if format is invalid
 * @description Validates semantic versioning (v1.2.3) or timestamp (v20250109-120000) format.
 * Because "v1" and "latest" are not real version numbers, Karen.
 */
export function validateVersionTag(version: unknown): VersionTag {
  if (typeof version !== 'string') {
    throw new ValidationError('Version tag must be a string', {
      field: 'version',
      expected: 'string',
      received: typeof version,
    })
  }

  try {
    return createVersionTag(version)
  } catch (error) {
    throw new ValidationError(`Invalid version format: ${version}`, {
      field: 'version',
      rule: 'Must be semantic (v1.2.3) or timestamp (v20250109-120000)',
      received: version,
    })
  }
}

/**
 * Validates an OpenAPI path format
 * @param path - Path string to validate
 * @returns The validated path
 * @throws ValidationError if format is invalid
 * @description Ensures paths start with / and don't contain invalid characters.
 * Because "/users/{id}" is valid but "users/{id}" is a rebel without a cause.
 */
export function validatePath(path: unknown): string {
  if (typeof path !== 'string') {
    throw new ValidationError('Path must be a string', {
      field: 'path',
      expected: 'string',
      received: typeof path,
    })
  }

  if (!path.startsWith('/')) {
    throw new ValidationError('Path must start with /', {
      field: 'path',
      rule: 'Must start with forward slash',
      received: path,
    })
  }

  // Check for invalid characters
  const invalidChars = /[<>"|?*]/
  if (invalidChars.test(path)) {
    throw new ValidationError('Path contains invalid characters', {
      field: 'path',
      rule: 'Cannot contain < > " | ? *',
      received: path,
    })
  }

  return path
}

/**
 * Validates an HTTP method
 * @param method - Method string to validate
 * @returns The validated method in uppercase
 * @throws ValidationError if not a valid HTTP method
 * @description Ensures the method is one of the standard HTTP methods.
 * YOLO is not a valid HTTP method, unfortunately.
 */
export function validateHttpMethod(method: unknown): string {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE']

  if (typeof method !== 'string') {
    throw new ValidationError('HTTP method must be a string', {
      field: 'method',
      expected: 'string',
      received: typeof method,
    })
  }

  const upperMethod = method.toUpperCase()
  if (!validMethods.includes(upperMethod)) {
    throw new ValidationError(`Invalid HTTP method: ${method}`, {
      field: 'method',
      expected: validMethods.join(', '),
      received: method,
    })
  }

  return upperMethod
}

/**
 * Validates a schema name
 * @param name - Schema name to validate
 * @returns The validated schema name
 * @throws ValidationError if format is invalid
 * @description Ensures schema names follow conventions (PascalCase alphanumeric).
 * "MySchema" is good, "my-schema" is trying but not quite there.
 */
export function validateSchemaName(name: unknown): string {
  if (typeof name !== 'string') {
    throw new ValidationError('Schema name must be a string', {
      field: 'schemaName',
      expected: 'string',
      received: typeof name,
    })
  }

  // PascalCase alphanumeric pattern
  const schemaNamePattern = /^[A-Z][a-zA-Z0-9]*$/
  if (!schemaNamePattern.test(name)) {
    throw new ValidationError(`Invalid schema name: ${name}`, {
      field: 'schemaName',
      rule: 'Must be PascalCase alphanumeric',
      received: name,
    })
  }

  return name
}

/**
 * Validates an email address
 * @param email - Email string to validate
 * @returns The validated email
 * @throws ValidationError if format is invalid
 * @description Basic email validation. Not perfect, but good enough for government work.
 */
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string', {
      field: 'email',
      expected: 'string',
      received: typeof email,
    })
  }

  // Basic email pattern (not RFC 5322 compliant, but practical)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    throw new ValidationError(`Invalid email format: ${email}`, {
      field: 'email',
      rule: 'Must be valid email format',
      received: email,
    })
  }

  return email
}

/**
 * Validates that a value is not null or undefined
 * @param value - Value to check
 * @param fieldName - Name of the field for error messages
 * @returns The value if it exists
 * @throws ValidationError if value is null or undefined
 * @description Ensures a value exists. Like checking if someone actually showed up
 * to the meeting, not just sent their "spirit" or "good vibes".
 */
export function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName,
      expected: 'non-null value',
      received: String(value),
    })
  }
  return value
}

/**
 * Validates that a string is not empty
 * @param value - String to check
 * @param fieldName - Name of the field for error messages
 * @returns The non-empty string
 * @throws ValidationError if string is empty or whitespace only
 * @description Ensures a string has actual content, not just enthusiastic whitespace.
 */
export function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, {
      field: fieldName,
      expected: 'string',
      received: typeof value,
    })
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, {
      field: fieldName,
      rule: 'Must contain non-whitespace characters',
      received: value,
    })
  }

  return value
}

