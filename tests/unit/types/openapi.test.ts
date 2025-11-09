/**
 * Tests for OpenAPI Types
 *
 * @description Tests for type guards, branded types, and version detection.
 * Because if our types are wrong, everything built on them is a house of cards. 🏚️
 */

import { describe, it, expect } from '@jest/globals'
import {
  isOpenAPI30,
  isOpenAPI31,
  isSwagger20,
  detectOpenAPIVersion,
  createApiId,
  createVersionTag,
} from '../../../src/types/openapi'

describe('OpenAPI Type Guards', () => {
  it('should identify OpenAPI 3.0 specs correctly', () => {
    const spec = { openapi: '3.0.0', info: { title: 'Test', version: '1.0.0' } }
    expect(isOpenAPI30(spec)).toBe(true)
    expect(isOpenAPI31(spec)).toBe(false)
    expect(isSwagger20(spec)).toBe(false)
  })

  it('should identify OpenAPI 3.1 specs correctly', () => {
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' } }
    expect(isOpenAPI31(spec)).toBe(true)
    expect(isOpenAPI30(spec)).toBe(false)
    expect(isSwagger20(spec)).toBe(false)
  })

  it('should identify Swagger 2.0 specs correctly', () => {
    const spec = { swagger: '2.0', info: { title: 'Test', version: '1.0.0' } }
    expect(isSwagger20(spec)).toBe(true)
    expect(isOpenAPI30(spec)).toBe(false)
    expect(isOpenAPI31(spec)).toBe(false)
  })

  it('should return false for invalid specs', () => {
    const invalidSpec = { info: { title: 'Test' } }
    expect(isOpenAPI30(invalidSpec)).toBe(false)
    expect(isOpenAPI31(invalidSpec)).toBe(false)
    expect(isSwagger20(invalidSpec)).toBe(false)
  })

  it('should return false for non-objects', () => {
    expect(isOpenAPI30(null)).toBe(false)
    expect(isOpenAPI30('string')).toBe(false)
    expect(isOpenAPI30(123)).toBe(false)
  })
})

describe('detectOpenAPIVersion', () => {
  it('should detect OpenAPI 3.0 version', () => {
    const spec = { openapi: '3.0.2', info: { title: 'Test', version: '1.0.0' } }
    expect(detectOpenAPIVersion(spec)).toBe('3.0')
  })

  it('should detect OpenAPI 3.1 version', () => {
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' } }
    expect(detectOpenAPIVersion(spec)).toBe('3.1')
  })

  it('should detect Swagger 2.0 version', () => {
    const spec = { swagger: '2.0', info: { title: 'Test', version: '1.0.0' } }
    expect(detectOpenAPIVersion(spec)).toBe('2.0')
  })

  it('should throw error for unknown version', () => {
    const invalidSpec = { info: { title: 'Test' } }
    expect(() => detectOpenAPIVersion(invalidSpec)).toThrow('Unknown or unsupported OpenAPI version')
  })
})

describe('createApiId', () => {
  it('should create valid API IDs', () => {
    expect(createApiId('my-api')).toBe('my-api')
    expect(createApiId('api-123')).toBe('api-123')
    expect(createApiId('test-api-v2')).toBe('test-api-v2')
  })

  it('should reject uppercase letters', () => {
    expect(() => createApiId('MyAPI')).toThrow('Invalid API ID format')
  })

  it('should reject spaces', () => {
    expect(() => createApiId('my api')).toThrow('Invalid API ID format')
  })

  it('should reject special characters', () => {
    expect(() => createApiId('my_api')).toThrow('Invalid API ID format')
    expect(() => createApiId('my.api')).toThrow('Invalid API ID format')
    expect(() => createApiId('my@api')).toThrow('Invalid API ID format')
  })

  it('should reject empty strings', () => {
    expect(() => createApiId('')).toThrow('Invalid API ID format')
  })
})

describe('createVersionTag', () => {
  it('should create valid semantic version tags', () => {
    expect(createVersionTag('v1.0.0')).toBe('v1.0.0')
    expect(createVersionTag('v2.1.3')).toBe('v2.1.3')
    expect(createVersionTag('v10.20.30')).toBe('v10.20.30')
  })

  it('should create valid timestamp version tags', () => {
    expect(createVersionTag('v20250109-120000')).toBe('v20250109-120000')
    expect(createVersionTag('v20240101-000000')).toBe('v20240101-000000')
  })

  it('should reject versions without v prefix', () => {
    expect(() => createVersionTag('1.0.0')).toThrow('Invalid version format')
  })

  it('should reject invalid semantic versions', () => {
    expect(() => createVersionTag('v1.0')).toThrow('Invalid version format')
    expect(() => createVersionTag('v1.0.0.0')).toThrow('Invalid version format')
  })

  it('should reject invalid timestamp versions', () => {
    expect(() => createVersionTag('v2025-01-09')).toThrow('Invalid version format')
    expect(() => createVersionTag('v20250109')).toThrow('Invalid version format')
  })

  it('should reject non-version strings', () => {
    expect(() => createVersionTag('latest')).toThrow('Invalid version format')
    expect(() => createVersionTag('beta')).toThrow('Invalid version format')
  })
})

