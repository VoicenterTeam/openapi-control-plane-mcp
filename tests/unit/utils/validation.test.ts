/**
 * Tests for Validation Utilities
 *
 * @description Tests for validation helper functions.
 * Testing validators is like testing seatbelts - boring but essential. 🔒
 */

import { describe, it, expect } from '@jest/globals'
import {
  validateApiId,
  validateVersionTag,
  validatePath,
  validateHttpMethod,
  validateSchemaName,
  validateEmail,
  requireField,
  requireNonEmptyString,
} from '../../../src/utils/validation'
import { ValidationError } from '../../../src/utils/errors'

describe('validateApiId', () => {
  it('should validate correct API IDs', () => {
    expect(validateApiId('my-api')).toBe('my-api')
    expect(validateApiId('test-123')).toBe('test-123')
  })

  it('should throw ValidationError for invalid API IDs', () => {
    expect(() => validateApiId('MyAPI')).toThrow(ValidationError)
    expect(() => validateApiId('my_api')).toThrow(ValidationError)
    expect(() => validateApiId(123)).toThrow(ValidationError)
  })
})

describe('validateVersionTag', () => {
  it('should validate semantic versions', () => {
    expect(validateVersionTag('v1.0.0')).toBe('v1.0.0')
    expect(validateVersionTag('v2.5.10')).toBe('v2.5.10')
  })

  it('should validate timestamp versions', () => {
    expect(validateVersionTag('v20250109-120000')).toBe('v20250109-120000')
  })

  it('should throw ValidationError for invalid versions', () => {
    expect(() => validateVersionTag('1.0.0')).toThrow(ValidationError)
    expect(() => validateVersionTag('latest')).toThrow(ValidationError)
    expect(() => validateVersionTag(123)).toThrow(ValidationError)
  })
})

describe('validatePath', () => {
  it('should validate correct paths', () => {
    expect(validatePath('/users')).toBe('/users')
    expect(validatePath('/users/{id}')).toBe('/users/{id}')
    expect(validatePath('/api/v1/items')).toBe('/api/v1/items')
  })

  it('should reject paths without leading slash', () => {
    expect(() => validatePath('users')).toThrow(ValidationError)
    expect(() => validatePath('api/users')).toThrow(ValidationError)
  })

  it('should reject paths with invalid characters', () => {
    expect(() => validatePath('/users?id=1')).toThrow(ValidationError)
    expect(() => validatePath('/users*')).toThrow(ValidationError)
    expect(() => validatePath('/users<test>')).toThrow(ValidationError)
  })

  it('should throw ValidationError for non-strings', () => {
    expect(() => validatePath(123)).toThrow(ValidationError)
    expect(() => validatePath(null)).toThrow(ValidationError)
  })
})

describe('validateHttpMethod', () => {
  it('should validate and uppercase HTTP methods', () => {
    expect(validateHttpMethod('get')).toBe('GET')
    expect(validateHttpMethod('POST')).toBe('POST')
    expect(validateHttpMethod('Put')).toBe('PUT')
    expect(validateHttpMethod('delete')).toBe('DELETE')
    expect(validateHttpMethod('PATCH')).toBe('PATCH')
  })

  it('should reject invalid methods', () => {
    expect(() => validateHttpMethod('YOLO')).toThrow(ValidationError)
    expect(() => validateHttpMethod('CONNECT')).toThrow(ValidationError)
    expect(() => validateHttpMethod('')).toThrow(ValidationError)
  })

  it('should throw ValidationError for non-strings', () => {
    expect(() => validateHttpMethod(123)).toThrow(ValidationError)
  })
})

describe('validateSchemaName', () => {
  it('should validate PascalCase schema names', () => {
    expect(validateSchemaName('User')).toBe('User')
    expect(validateSchemaName('UserProfile')).toBe('UserProfile')
    expect(validateSchemaName('APIResponse')).toBe('APIResponse')
  })

  it('should reject non-PascalCase names', () => {
    expect(() => validateSchemaName('user')).toThrow(ValidationError)
    expect(() => validateSchemaName('user_profile')).toThrow(ValidationError)
    expect(() => validateSchemaName('user-profile')).toThrow(ValidationError)
  })

  it('should reject names with special characters', () => {
    expect(() => validateSchemaName('User!')).toThrow(ValidationError)
    expect(() => validateSchemaName('User.Profile')).toThrow(ValidationError)
  })

  it('should throw ValidationError for non-strings', () => {
    expect(() => validateSchemaName(123)).toThrow(ValidationError)
  })
})

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com')).toBe('user@example.com')
    expect(validateEmail('test.user@domain.co.uk')).toBe('test.user@domain.co.uk')
    expect(validateEmail('user+tag@example.com')).toBe('user+tag@example.com')
  })

  it('should reject invalid email addresses', () => {
    expect(() => validateEmail('invalid')).toThrow(ValidationError)
    expect(() => validateEmail('user@')).toThrow(ValidationError)
    expect(() => validateEmail('@example.com')).toThrow(ValidationError)
    expect(() => validateEmail('user @example.com')).toThrow(ValidationError)
  })

  it('should throw ValidationError for non-strings', () => {
    expect(() => validateEmail(123)).toThrow(ValidationError)
  })
})

describe('requireField', () => {
  it('should return value if not null or undefined', () => {
    expect(requireField('test', 'field')).toBe('test')
    expect(requireField(123, 'field')).toBe(123)
    expect(requireField(false, 'field')).toBe(false)
    expect(requireField(0, 'field')).toBe(0)
  })

  it('should throw ValidationError for null', () => {
    expect(() => requireField(null, 'testField')).toThrow(ValidationError)
    expect(() => requireField(null, 'testField')).toThrow('testField is required')
  })

  it('should throw ValidationError for undefined', () => {
    expect(() => requireField(undefined, 'testField')).toThrow(ValidationError)
    expect(() => requireField(undefined, 'testField')).toThrow('testField is required')
  })
})

describe('requireNonEmptyString', () => {
  it('should return non-empty strings', () => {
    expect(requireNonEmptyString('test', 'field')).toBe('test')
    expect(requireNonEmptyString('  test  ', 'field')).toBe('  test  ')
  })

  it('should throw ValidationError for empty strings', () => {
    expect(() => requireNonEmptyString('', 'field')).toThrow(ValidationError)
    expect(() => requireNonEmptyString('   ', 'field')).toThrow(ValidationError)
    expect(() => requireNonEmptyString('\t\n', 'field')).toThrow(ValidationError)
  })

  it('should throw ValidationError for non-strings', () => {
    expect(() => requireNonEmptyString(123, 'field')).toThrow(ValidationError)
    expect(() => requireNonEmptyString(null, 'field')).toThrow(ValidationError)
  })
})

