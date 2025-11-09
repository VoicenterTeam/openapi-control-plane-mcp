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
import * as SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPI } from 'openapi-types'

// Mock swagger-parser
jest.mock('@apidevtools/swagger-parser')

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
      ;(SwaggerParser.parse as jest.Mock).mockResolvedValue(sampleSpec)

      const result = await specManager.loadSpec('test-api', 'v1.0.0')

      expect(mockStorage.read).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
      expect(SwaggerParser.parse).toHaveBeenCalled()
      expect(result.spec).toEqual(sampleSpec)
      expect(result.version).toBe('3.0')
    })

    it('should load and parse JSON spec', async () => {
      const jsonContent = JSON.stringify(sampleSpec)
      mockStorage.read.mockResolvedValue(jsonContent)
      ;(SwaggerParser.parse as jest.Mock).mockResolvedValue(sampleSpec)

      const result = await specManager.loadSpec('test-api', 'v1.0.0')

      expect(result.spec).toEqual(sampleSpec)
    })

    it('should throw StorageError if spec file not found', async () => {
      mockStorage.read.mockRejectedValue(new Error('ENOENT'))

      await expect(specManager.loadSpec('missing-api', 'v1.0.0')).rejects.toThrow(StorageError)
    })

    it('should throw error if spec is invalid', async () => {
      mockStorage.read.mockResolvedValue('invalid yaml content: [[[')
      ;(SwaggerParser.parse as jest.Mock).mockRejectedValue(
        new Error('Invalid YAML')
      )

      await expect(specManager.loadSpec('test-api', 'v1.0.0')).rejects.toThrow()
    })
  })

  describe('saveSpec', () => {
    it('should save spec as YAML by default', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockResolvedValue()

      await specManager.saveSpec('test-api', 'v1.0.0', sampleSpec)

      expect(mockStorage.ensureDirectory).toHaveBeenCalledWith('test-api/v1.0.0')
      expect(mockStorage.write).toHaveBeenCalled()

      const writeCall = mockStorage.write.mock.calls[0]
      expect(writeCall[0]).toBe('test-api/v1.0.0/spec.yaml')
      expect(writeCall[1]).toContain('openapi: "3.0.0"')
    })

    it('should save spec as JSON when format specified', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockResolvedValue()

      await specManager.saveSpec('test-api', 'v1.0.0', sampleSpec, 'json')

      const writeCall = mockStorage.write.mock.calls[0]
      expect(writeCall[0]).toBe('test-api/v1.0.0/spec.json')
      expect(writeCall[1]).toContain('"openapi": "3.0.0"')
    })

    it('should throw StorageError on write failure', async () => {
      mockStorage.ensureDirectory.mockResolvedValue()
      mockStorage.write.mockRejectedValue(new Error('Disk full'))

      await expect(specManager.saveSpec('test-api', 'v1.0.0', sampleSpec)).rejects.toThrow(
        StorageError
      )
    })
  })

  describe('specExists', () => {
    it('should return true if spec exists', async () => {
      mockStorage.exists.mockResolvedValue(true)

      const result = await specManager.specExists('test-api', 'v1.0.0')

      expect(result).toBe(true)
      expect(mockStorage.exists).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
    })

    it('should return false if spec does not exist', async () => {
      mockStorage.exists.mockResolvedValue(false)

      const result = await specManager.specExists('test-api', 'v1.0.0')

      expect(result).toBe(false)
    })
  })

  describe('deleteSpec', () => {
    it('should delete spec file', async () => {
      mockStorage.delete.mockResolvedValue()

      await specManager.deleteSpec('test-api', 'v1.0.0')

      expect(mockStorage.delete).toHaveBeenCalledWith('test-api/v1.0.0/spec.yaml')
    })

    it('should throw StorageError on delete failure', async () => {
      mockStorage.delete.mockRejectedValue(new Error('Permission denied'))

      await expect(specManager.deleteSpec('test-api', 'v1.0.0')).rejects.toThrow(StorageError)
    })
  })
})

