/**
 * Tests for SpecManager Service
 *
 * @description Tests for OpenAPI spec management service.
 * Testing the spec manager is like testing a library - you need to check
 * if it can find books, store them properly, and not lose them. 📚
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { SpecManager } from '../../../src/services/spec-manager'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import { StorageError } from '../../../src/utils/errors'
import { createApiId, createVersionTag } from '../../../src/types/openapi'
import * as SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPI } from 'openapi-types'

// Mock swagger-parser
jest.mock('@apidevtools/swagger-parser', () => ({
  __esModule: true,
  default: {
    parse: jest.fn(),
    validate: jest.fn(),
  },
}))

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  logStorageOperation: jest.fn(),
}))

describe('SpecManager', () => {
  let specManager: SpecManager
  let mockStorage: jest.Mocked<FileSystemStorage>
  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const sampleSpec: OpenAPI.Document = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users': {
        get: {
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      },
    },
  }

  beforeEach(() => {
    mockStorage = {
      read: jest.fn(),
      write: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      ensureDirectory: jest.fn(),
    } as unknown as jest.Mocked<FileSystemStorage>

    specManager = new SpecManager(mockStorage)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('loadSpec', () => {
    it('should load and parse YAML spec', async () => {
      const yamlContent = 'openapi: "3.0.0"\ninfo:\n  title: Test\n  version: 1.0.0'
      mockStorage.read.mockResolvedValue(yamlContent)
      mockStorage.exists.mockResolvedValue(true)
      ;(SwaggerParser.default.parse as any).mockResolvedValue(sampleSpec)

      const result = await specManager.loadSpec(apiId, version)

      expect(mockStorage.read).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
      expect(SwaggerParser.default.parse).toHaveBeenCalled()
      expect(result.spec).toEqual(sampleSpec)
      expect(result.version).toBe('3.0')
    })

    it('should load and parse JSON spec', async () => {
      const jsonContent = JSON.stringify(sampleSpec)
      mockStorage.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
      mockStorage.read.mockResolvedValue(jsonContent)
      ;(SwaggerParser.default.parse as any).mockResolvedValue(sampleSpec)

      const result = await specManager.loadSpec(apiId, version)

      expect(result.spec).toEqual(sampleSpec)
    })

    it('should throw StorageError if spec file not found', async () => {
      mockStorage.read.mockRejectedValue(new Error('ENOENT'))
      mockStorage.exists.mockResolvedValue(false)

      await expect(specManager.loadSpec(createApiId('missing-api'), version)).rejects.toThrow(
        StorageError
      )
    })

    it('should throw error if spec is invalid', async () => {
      mockStorage.read.mockResolvedValue('invalid yaml content: [[[')
      mockStorage.exists.mockResolvedValue(true)
      ;(SwaggerParser.default.parse as any).mockRejectedValue(new Error('Invalid YAML'))

      await expect(specManager.loadSpec(apiId, version)).rejects.toThrow()
    })
  })

  describe('saveSpec', () => {
    it('should save spec as YAML by default', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockResolvedValue()

      await specManager.saveSpec(apiId, version, sampleSpec)

      expect(mockStorage.ensureDirectory).toHaveBeenCalledWith('test-api/v1.0.0')
      expect(mockStorage.write).toHaveBeenCalled()

      const writeCall = mockStorage.write.mock.calls[0]
      expect(writeCall[0]).toBe('test-api/v1.0.0/spec.yaml')
      expect(writeCall[1]).toContain('openapi:')
      expect(writeCall[1]).toContain('3.0.0')
    })

    it('should save spec as JSON when format specified', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockResolvedValue()

      await specManager.saveSpec(apiId, version, sampleSpec, 'json')

      const writeCall = mockStorage.write.mock.calls[0]
      expect(writeCall[0]).toBe('test-api/v1.0.0/spec.json')
      expect(writeCall[1]).toContain('"openapi": "3.0.0"')
    })

    it('should throw StorageError on write failure', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockRejectedValue(new Error('Disk full'))

      await expect(specManager.saveSpec(apiId, version, sampleSpec)).rejects.toThrow(
        StorageError
      )
    })
  })

  describe('specExists', () => {
    it('should return true if spec exists', async () => {
      mockStorage.exists.mockResolvedValue(true)

      const result = await specManager.specExists(apiId, version)

      expect(result).toBe(true)
      expect(mockStorage.exists).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
    })

    it('should return false if spec does not exist', async () => {
      mockStorage.exists.mockResolvedValue(false)

      const result = await specManager.specExists(apiId, version)

      expect(result).toBe(false)
    })
  })

  describe('deleteSpec', () => {
    it('should delete spec file', async () => {
      mockStorage.delete.mockResolvedValue()
      mockStorage.exists.mockResolvedValue(true)

      await specManager.deleteSpec(apiId, version)

      expect(mockStorage.delete).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
    })

    it('should throw StorageError on delete failure', async () => {
      mockStorage.delete.mockRejectedValue(new Error('Permission denied'))
      mockStorage.exists.mockResolvedValue(true)

      await expect(specManager.deleteSpec(apiId, version)).rejects.toThrow(StorageError)
    })
  })
})

