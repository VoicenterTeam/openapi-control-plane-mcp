/**
 * Error Types Tests
 */

import { serializeError } from '../../../src/types/errors'

describe('serializeError', () => {
  it('should serialize basic error', () => {
    const error = new Error('Test error')
    const serialized = serializeError(error)

    expect(serialized.message).toBe('Test error')
    expect(serialized.stack).toBeDefined()
  })

  it('should include type property if present', () => {
    const error: any = new Error('Test error')
    error.type = 'custom_type'

    const serialized = serializeError(error)

    expect(serialized.type).toBe('custom_type')
  })

  it('should include code property if present', () => {
    const error: any = new Error('Test error')
    error.code = 'ERR_CODE'

    const serialized = serializeError(error)

    expect(serialized.code).toBe('ERR_CODE')
  })

  it('should include details property if present', () => {
    const error: any = new Error('Test error')
    error.details = { key: 'value', nested: { data: 123 } }

    const serialized = serializeError(error)

    expect(serialized.details).toEqual({ key: 'value', nested: { data: 123 } })
  })

  it('should serialize nested cause errors', () => {
    const causeError = new Error('Cause error')
    const error: any = new Error('Main error')
    error.cause = causeError

    const serialized = serializeError(error)

    expect(serialized.cause).toBeDefined()
    expect((serialized.cause as any).message).toBe('Cause error')
  })

  it('should serialize deeply nested causes', () => {
    const rootCause = new Error('Root cause')
    const middleError: any = new Error('Middle error')
    middleError.cause = rootCause
    const topError: any = new Error('Top error')
    topError.cause = middleError

    const serialized = serializeError(topError)

    expect(serialized.cause).toBeDefined()
    expect((serialized.cause as any).cause).toBeDefined()
    expect((serialized.cause as any).cause.message).toBe('Root cause')
  })

  it('should handle all properties together', () => {
    const causeError = new Error('Underlying issue')
    const error: any = new Error('Complex error')
    error.type = 'VALIDATION_ERROR'
    error.code = 'E001'
    error.details = { field: 'email', value: 'invalid' }
    error.cause = causeError

    const serialized = serializeError(error)

    expect(serialized.message).toBe('Complex error')
    expect(serialized.type).toBe('VALIDATION_ERROR')
    expect(serialized.code).toBe('E001')
    expect(serialized.details).toEqual({ field: 'email', value: 'invalid' })
    expect((serialized.cause as any).message).toBe('Underlying issue')
  })

  it('should not fail on errors without custom properties', () => {
    const error = new Error('Plain error')

    const serialized = serializeError(error)

    expect(serialized.message).toBe('Plain error')
    expect(serialized.type).toBeUndefined()
    expect(serialized.code).toBeUndefined()
    expect(serialized.details).toBeUndefined()
    expect(serialized.cause).toBeUndefined()
  })
})

