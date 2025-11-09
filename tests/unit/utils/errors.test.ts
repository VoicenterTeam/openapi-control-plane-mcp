/**
 * Tests for Error Classes
 *
 * @description Tests for custom error types.
 * Because even errors need to be tested. Meta, right? 🤔
 */

import { describe, it, expect } from '@jest/globals'
import {
  ValidationError,
  StorageError,
  ToolError,
  ReferenceError,
  createValidationError,
  createStorageError,
  createToolError,
  createReferenceError,
} from '../../../src/utils/errors'
import { ErrorType } from '../../../src/types/errors'

describe('ValidationError', () => {
  it('should create error with message and type', () => {
    const error = new ValidationError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.type).toBe(ErrorType.VALIDATION_ERROR)
    expect(error.name).toBe('ValidationError')
    expect(error.stack).toBeDefined()
  })

  it('should store field information', () => {
    const error = new ValidationError('Invalid field', {
      field: 'email',
      expected: 'email format',
      received: 'invalid',
      rule: 'email_format',
    })

    expect(error.field).toBe('email')
    expect(error.expected).toBe('email format')
    expect(error.received).toBe('invalid')
    expect(error.rule).toBe('email_format')
  })

  it('should store cause error', () => {
    const cause = new Error('Original error')
    const error = new ValidationError('Validation failed', { cause })
    expect(error.cause).toBe(cause)
  })
})

describe('StorageError', () => {
  it('should create error with path and operation', () => {
    const error = new StorageError('File not found', {
      path: '/data/file.yaml',
      operation: 'read',
    })

    expect(error.message).toBe('File not found')
    expect(error.type).toBe(ErrorType.STORAGE_ERROR)
    expect(error.path).toBe('/data/file.yaml')
    expect(error.operation).toBe('read')
  })

  it('should handle all operation types', () => {
    const ops: Array<'read' | 'write' | 'delete' | 'list' | 'exists'> = [
      'read',
      'write',
      'delete',
      'list',
      'exists',
    ]

    ops.forEach(op => {
      const error = new StorageError('Error', { operation: op })
      expect(error.operation).toBe(op)
    })
  })
})

describe('ToolError', () => {
  it('should create error with tool name and params', () => {
    const params = { apiId: 'test-api', queryType: 'full_spec' }
    const error = new ToolError('Tool execution failed', {
      tool_name: 'spec_read',
      params,
    })

    expect(error.message).toBe('Tool execution failed')
    expect(error.type).toBe(ErrorType.TOOL_ERROR)
    expect(error.tool_name).toBe('spec_read')
    expect(error.params).toEqual(params)
  })
})

describe('ReferenceError', () => {
  it('should create error with ref path and location', () => {
    const error = new ReferenceError('Reference not found', {
      ref_path: '#/components/schemas/User',
      location: 'paths./users.get.responses.200',
    })

    expect(error.message).toBe('Reference not found')
    expect(error.type).toBe(ErrorType.REFERENCE_ERROR)
    expect(error.ref_path).toBe('#/components/schemas/User')
    expect(error.location).toBe('paths./users.get.responses.200')
  })
})

describe('Error Factory Functions', () => {
  it('createValidationError should create ValidationError', () => {
    const error = createValidationError('Invalid', 'email', 'email@example.com', 'invalid')

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.field).toBe('email')
    expect(error.expected).toBe('email@example.com')
    expect(error.received).toBe('invalid')
  })

  it('createStorageError should create StorageError', () => {
    const cause = new Error('File system error')
    const error = createStorageError('Failed', '/path/to/file', 'write', cause)

    expect(error).toBeInstanceOf(StorageError)
    expect(error.path).toBe('/path/to/file')
    expect(error.operation).toBe('write')
    expect(error.cause).toBe(cause)
  })

  it('createToolError should create ToolError', () => {
    const params = { test: 'value' }
    const cause = new Error('Execution failed')
    const error = createToolError('Failed', 'my_tool', params, cause)

    expect(error).toBeInstanceOf(ToolError)
    expect(error.tool_name).toBe('my_tool')
    expect(error.params).toEqual(params)
    expect(error.cause).toBe(cause)
  })

  it('createReferenceError should create ReferenceError', () => {
    const error = createReferenceError('Not found', '#/components/schemas/User', 'path.to.ref')

    expect(error).toBeInstanceOf(ReferenceError)
    expect(error.ref_path).toBe('#/components/schemas/User')
    expect(error.location).toBe('path.to.ref')
  })
})

describe('Error Inheritance', () => {
  it('custom errors should be instanceof Error', () => {
    expect(new ValidationError('test')).toBeInstanceOf(Error)
    expect(new StorageError('test')).toBeInstanceOf(Error)
    expect(new ToolError('test')).toBeInstanceOf(Error)
    expect(new ReferenceError('test')).toBeInstanceOf(Error)
  })

  it('should have correct constructor names', () => {
    expect(new ValidationError('test').name).toBe('ValidationError')
    expect(new StorageError('test').name).toBe('StorageError')
    expect(new ToolError('test').name).toBe('ToolError')
    expect(new ReferenceError('test').name).toBe('ReferenceError')
  })
})

