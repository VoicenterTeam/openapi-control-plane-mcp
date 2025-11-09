/**
 * Tests for Config
 */

import { config } from '../../../src/config'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('environment variables', () => {
    it('should load default values', () => {
      delete process.env.PORT
      delete process.env.HOST
      delete process.env.DATA_DIR
      delete process.env.LOG_LEVEL

      // Re-import to pick up env changes
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        
        expect(freshConfig.PORT).toBe(3000)
        expect(freshConfig.HOST).toBe('0.0.0.0')
        expect(freshConfig.DATA_DIR).toContain('data')
        expect(freshConfig.LOG_LEVEL).toBe('info')
      })
    })

    it('should load custom PORT', () => {
      process.env.PORT = '8080'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        expect(freshConfig.PORT).toBe(8080)
      })
    })

    it('should load custom HOST', () => {
      process.env.HOST = '127.0.0.1'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        expect(freshConfig.HOST).toBe('127.0.0.1')
      })
    })

    it('should load custom DATA_DIR', () => {
      process.env.DATA_DIR = '/custom/data'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        expect(freshConfig.DATA_DIR).toBe('/custom/data')
      })
    })

    it('should load custom LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'debug'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        expect(freshConfig.LOG_LEVEL).toBe('debug')
      })
    })

    it('should validate NODE_ENV', () => {
      process.env.NODE_ENV = 'production'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        expect(['development', 'production', 'test']).toContain(freshConfig.NODE_ENV)
      })
    })

    it('should reject invalid PORT', () => {
      process.env.PORT = 'invalid'
      
      expect(() => {
        jest.isolateModules(() => {
          require('../../../src/config')
        })
      }).toThrow()
    })

    it('should reject invalid LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'invalid-level'
      
      expect(() => {
        jest.isolateModules(() => {
          require('../../../src/config')
        })
      }).toThrow()
    })
  })

  describe('custom x-attributes', () => {
    it('should load custom x-attributes from environment', () => {
      process.env.X_ATTRIBUTE_INFO_LOGO = 'Logo URL for the API'
      process.env.X_ATTRIBUTE_ENDPOINT_TEAM = 'Team responsible'
      
      jest.isolateModules(() => {
        const { config: freshConfig } = require('../../../src/config')
        
        // Config should have loaded these
        expect(freshConfig).toBeDefined()
      })
    })

    it('should handle missing x-attributes gracefully', () => {
      // Clear all X_ATTRIBUTE_ env vars
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('X_ATTRIBUTE_')) {
          delete process.env[key]
        }
      })
      
      expect(() => {
        jest.isolateModules(() => {
          require('../../../src/config')
        })
      }).not.toThrow()
    })
  })

  describe('configuration object', () => {
    it('should have all required properties', () => {
      expect(config).toHaveProperty('PORT')
      expect(config).toHaveProperty('HOST')
      expect(config).toHaveProperty('DATA_DIR')
      expect(config).toHaveProperty('LOG_LEVEL')
      expect(config).toHaveProperty('NODE_ENV')
    })

    it('should have correct types', () => {
      expect(typeof config.PORT).toBe('number')
      expect(typeof config.HOST).toBe('string')
      expect(typeof config.DATA_DIR).toBe('string')
      expect(typeof config.LOG_LEVEL).toBe('string')
      expect(typeof config.NODE_ENV).toBe('string')
    })

    it('should have valid port range', () => {
      expect(config.PORT).toBeGreaterThan(0)
      expect(config.PORT).toBeLessThanOrEqual(65535)
    })

    it('should have valid log level', () => {
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(config.LOG_LEVEL)
    })

    it('should have valid node environment', () => {
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV)
    })
  })
})

