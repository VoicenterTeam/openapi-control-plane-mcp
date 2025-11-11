/**
 * Logger Tests
 */

import { logger, logStorageOperation } from '../../../src/utils/logger'

describe('logger', () => {
  it('should log info messages', () => {
    expect(() => logger.info('Test info message')).not.toThrow()
  })

  it('should log info with metadata', () => {
    expect(() => logger.info({ key: 'value' }, 'Test with metadata')).not.toThrow()
  })

  it('should log debug messages', () => {
    expect(() => logger.debug('Test debug message')).not.toThrow()
  })

  it('should log warn messages', () => {
    expect(() => logger.warn('Test warn message')).not.toThrow()
  })

  it('should log error messages', () => {
    expect(() => logger.error('Test error message')).not.toThrow()
  })

  it('should log error with error object', () => {
    expect(() => logger.error({ err: new Error('test') }, 'Error occurred')).not.toThrow()
  })

  it('should log child logger messages', () => {
    const child = logger.child({ component: 'test' })
    expect(() => child.info('Child message')).not.toThrow()
  })

  it('should handle fatal level', () => {
    expect(() => logger.fatal('Fatal error')).not.toThrow()
  })

  it('should handle trace level', () => {
    expect(() => logger.trace('Trace message')).not.toThrow()
  })

  it('should return logger instance', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })
})

describe('logStorageOperation', () => {
  it('should log successful storage write operation', () => {
    expect(() => logStorageOperation('write', 'test-key', true)).not.toThrow()
  })

  it('should log storage delete operation', () => {
    expect(() => logStorageOperation('delete', 'test-key', true)).not.toThrow()
  })

  it('should log storage operation success without error', () => {
    expect(() => logStorageOperation('write', 'test-key', true)).not.toThrow()
  })
})

