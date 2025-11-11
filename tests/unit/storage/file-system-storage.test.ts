/**
 * Tests for FileSystemStorage
 *
 * @description Tests for file system storage provider.
 * Mocking the file system because we don't want to leave test files
 * scattered around like digital breadcrumbs. 🍞
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { promises as fs } from 'fs'
import * as path from 'path'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import { StorageError } from '../../../src/utils/errors'

// Mock fs/promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
  },
}))

// Mock logger to avoid console spam
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  logStorageOperation: jest.fn(),
}))

describe('FileSystemStorage', () => {
  let storage: FileSystemStorage
  const basePath = '/test/data'

  beforeEach(() => {
    storage = new FileSystemStorage({ basePath })
    jest.clearAllMocks()
  })

  describe('read', () => {
    it('should read file content', async () => {
      const mockContent = 'file content'
      ;(fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(mockContent)

      const result = await storage.read('test/file.txt')

      expect(result).toBe(mockContent)
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(basePath, 'test/file.txt'),
        'utf-8'
      )
    })

    it('should throw StorageError on read failure', async () => {
      const error = new Error('File not found')
      ;(fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(error)

      await expect(storage.read('missing.txt')).rejects.toThrow(StorageError)
    })

    it('should handle keys with leading slash', async () => {
      ;(fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('content')

      await storage.read('/test/file.txt')

      expect(fs.readFile).toHaveBeenCalledWith(path.join(basePath, 'test/file.txt'), 'utf-8')
    })
  })

  describe('write', () => {
    it('should write file atomically', async () => {
      ;(fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined)
      ;(fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue()
      ;(fs.rename as jest.MockedFunction<typeof fs.rename>).mockResolvedValue()

      await storage.write('test/file.txt', 'content')

      // Should write to temp file
      expect(fs.writeFile).toHaveBeenCalled()
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0]
      expect(writeCall[0]).toMatch(/\.tmp\.\d+$/)
      expect(writeCall[1]).toBe('content')

      // Should rename temp to final
      expect(fs.rename).toHaveBeenCalled()
    })

    it('should create parent directory if needed', async () => {
      ;(fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined)
      ;(fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue()
      ;(fs.rename as jest.MockedFunction<typeof fs.rename>).mockResolvedValue()

      await storage.write('test/nested/file.txt', 'content')

      expect(fs.mkdir).toHaveBeenCalled()
      const mkdirCall = (fs.mkdir as jest.Mock).mock.calls[0]
      expect(mkdirCall[0]).toContain('nested')
      expect(mkdirCall[1]).toEqual(expect.objectContaining({ recursive: true }))
    })

    it('should clean up temp file on write error', async () => {
      ;(fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined)
      ;(fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue()
      ;(fs.rename as jest.MockedFunction<typeof fs.rename>).mockRejectedValue(
        new Error('Rename failed')
      )
      ;(fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockResolvedValue()

      await expect(storage.write('test/file.txt', 'content')).rejects.toThrow(StorageError)

      // Should attempt to clean up temp file
      expect(fs.unlink).toHaveBeenCalled()
    })
  })

  describe('list', () => {
    it('should list files recursively', async () => {
      const mockEntries = [
        { name: 'file1.json', isDirectory: () => false },
        { name: 'subdir', isDirectory: () => true },
        { name: 'file2.json', isDirectory: () => false },
      ];
      const mockSubdirEntries = [
        { name: 'nested.json', isDirectory: () => false },
      ];

      (fs.readdir as jest.MockedFunction<typeof fs.readdir>)
        .mockResolvedValueOnce(mockEntries as any)
        .mockResolvedValueOnce(mockSubdirEntries as any)

      const result = await storage.list('test/prefix')

      expect(result).toHaveLength(3)
      expect(result.some(f => f.includes('file1.json'))).toBe(true)
      expect(result.some(f => f.includes('file2.json'))).toBe(true)
      expect(result.some(f => f.includes('nested.json'))).toBe(true)
    })

    it('should return empty array when directory does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      ;(fs.readdir as jest.MockedFunction<typeof fs.readdir>).mockRejectedValue(error)

      const result = await storage.list('nonexistent')

      expect(result).toEqual([])
    })

    it('should throw StorageError on list failure', async () => {
      const error = new Error('Permission denied')
      ;(fs.readdir as jest.MockedFunction<typeof fs.readdir>).mockRejectedValue(error)

      await expect(storage.list('test')).rejects.toThrow(StorageError)
    })

    it('should handle nested directories', async () => {
      const mockLevel1 = [
        { name: 'dir1', isDirectory: () => true },
      ];
      const mockLevel2 = [
        { name: 'file.json', isDirectory: () => false },
      ];

      (fs.readdir as jest.MockedFunction<typeof fs.readdir>)
        .mockResolvedValueOnce(mockLevel1 as any)
        .mockResolvedValueOnce(mockLevel2 as any)

      const result = await storage.list('')

      expect(result).toHaveLength(1)
      expect(result[0]).toContain('file.json')
    })
  })

  describe('exists', () => {
    it('should return true if file exists', async () => {
      ;(fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue()

      const result = await storage.exists('test/file.txt')

      expect(result).toBe(true)
      expect(fs.access).toHaveBeenCalledWith(path.join(basePath, 'test/file.txt'))
    })

    it('should return false if file does not exist', async () => {
      ;(fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT')
      )

      const result = await storage.exists('missing.txt')

      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete file', async () => {
      ;(fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockResolvedValue()

      await storage.delete('test/file.txt')

      expect(fs.unlink).toHaveBeenCalledWith(path.join(basePath, 'test/file.txt'))
    })

    it('should throw StorageError on delete failure', async () => {
      ;(fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockRejectedValue(
        new Error('Permission denied')
      )

      await expect(storage.delete('test/file.txt')).rejects.toThrow(StorageError)
    })
  })

  describe('ensureDirectory', () => {
    it('should create directory recursively', async () => {
      ;(fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined)

      await storage.ensureDirectory('/test/nested/dir')

      expect(fs.mkdir).toHaveBeenCalledWith('/test/nested/dir', { recursive: true })
    })

    it('should throw StorageError on mkdir failure', async () => {
      ;(fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockRejectedValue(
        new Error('Permission denied')
      )

      await expect(storage.ensureDirectory('/test/dir')).rejects.toThrow(StorageError)
    })
  })

  describe('key validation', () => {
    it('should reject empty keys', async () => {
      await expect(storage.read('')).rejects.toThrow('Storage key cannot be empty')
    })

    it('should reject keys with directory traversal', async () => {
      await expect(storage.read('../../../etc/passwd')).rejects.toThrow('directory traversal')
    })

    it('should reject absolute system paths', async () => {
      await expect(storage.read('//absolute/path')).rejects.toThrow('absolute system path')
    })
  })
})

