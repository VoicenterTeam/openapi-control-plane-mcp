/**
 * Tests for LockManager
 */

import { LockManager } from '../../../src/storage/lock-manager'
import * as lockfile from 'proper-lockfile'

// Mock proper-lockfile
jest.mock('proper-lockfile')

describe('LockManager', () => {
  let lockManager: LockManager
  const mockLockfile = lockfile as jest.Mocked<typeof lockfile>

  beforeEach(() => {
    lockManager = new LockManager()
    jest.clearAllMocks()
  })

  describe('withLock', () => {
    it('should execute operation with lock', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue('result')

      const result = await lockManager.withLock('/test/file.txt', operation)

      expect(mockLockfile.lock).toHaveBeenCalledWith(
        '/test/file.txt',
        expect.objectContaining({
          retries: expect.any(Object),
          stale: expect.any(Number),
        })
      )
      expect(operation).toHaveBeenCalled()
      expect(mockRelease).toHaveBeenCalled()
      expect(result).toBe('result')
    })

    it('should release lock even if operation throws', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))

      await expect(lockManager.withLock('/test/file.txt', operation)).rejects.toThrow(
        'Operation failed'
      )

      expect(mockRelease).toHaveBeenCalled()
    })

    it('should throw StorageError if lock acquisition fails', async () => {
      mockLockfile.lock.mockRejectedValue(new Error('Lock timeout'))

      await expect(
        lockManager.withLock('/test/file.txt', async () => 'result')
      ).rejects.toThrow('Failed to acquire lock')
    })

    it('should return operation result', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue({ data: 'test', count: 42 })

      const result = await lockManager.withLock('/test/file.txt', operation)

      expect(result).toEqual({ data: 'test', count: 42 })
    })

    it('should handle async operations', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async-result'
      })

      const result = await lockManager.withLock('/test/file.txt', operation)

      expect(result).toBe('async-result')
      expect(mockRelease).toHaveBeenCalled()
    })

    it('should use custom retry options', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue('result')

      await lockManager.withLock('/test/file.txt', operation, { retries: 10 })

      expect(mockLockfile.lock).toHaveBeenCalledWith(
        '/test/file.txt',
        expect.objectContaining({
          retries: expect.objectContaining({
            retries: 10,
          }),
        })
      )
    })

    it('should handle lock release failures gracefully', async () => {
      const mockRelease = jest.fn().mockRejectedValue(new Error('Release failed'))
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue('result')

      // Should not throw, just warn
      const result = await lockManager.withLock('/test/file.txt', operation)

      expect(result).toBe('result')
      expect(mockRelease).toHaveBeenCalled()
    })

    it('should pass through operation errors', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const customError = new Error('Custom operation error')
      const operation = jest.fn().mockRejectedValue(customError)

      await expect(lockManager.withLock('/test/file.txt', operation)).rejects.toThrow(
        'Custom operation error'
      )

      expect(mockRelease).toHaveBeenCalled()
    })
  })

  describe('isLocked', () => {
    it('should return true if file is locked', async () => {
      mockLockfile.check.mockResolvedValue(true)

      const result = await lockManager.isLocked('/test/file.txt')

      expect(result).toBe(true)
      expect(mockLockfile.check).toHaveBeenCalledWith('/test/file.txt')
    })

    it('should return false if file is not locked', async () => {
      mockLockfile.check.mockResolvedValue(false)

      const result = await lockManager.isLocked('/test/file.txt')

      expect(result).toBe(false)
    })

    it('should return false if check fails', async () => {
      mockLockfile.check.mockRejectedValue(new Error('Check failed'))

      const result = await lockManager.isLocked('/test/file.txt')

      expect(result).toBe(false)
    })

    it('should handle ENOENT errors', async () => {
      const error: any = new Error('File not found')
      error.code = 'ENOENT'
      mockLockfile.check.mockRejectedValue(error)

      const result = await lockManager.isLocked('/test/file.txt')

      expect(result).toBe(false)
    })
  })

  describe('forceUnlock', () => {
    it('should force unlock a file', async () => {
      mockLockfile.unlock.mockResolvedValue(undefined)

      await lockManager.forceUnlock('/test/file.txt')

      expect(mockLockfile.unlock).toHaveBeenCalledWith('/test/file.txt')
    })

    it('should throw StorageError if unlock fails', async () => {
      mockLockfile.unlock.mockRejectedValue(new Error('Unlock failed'))

      await expect(lockManager.forceUnlock('/test/file.txt')).rejects.toThrow(
        'Failed to force unlock'
      )
    })

    it('should handle ENOENT errors', async () => {
      const error: any = new Error('Lock file not found')
      error.code = 'ENOENT'
      mockLockfile.unlock.mockRejectedValue(error)

      await expect(lockManager.forceUnlock('/test/file.txt')).rejects.toThrow()
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent locks on different files', async () => {
      const mockRelease1 = jest.fn().mockResolvedValue(undefined)
      const mockRelease2 = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock
        .mockResolvedValueOnce(mockRelease1)
        .mockResolvedValueOnce(mockRelease2)

      const operation1 = jest.fn().mockResolvedValue('result1')
      const operation2 = jest.fn().mockResolvedValue('result2')

      const [result1, result2] = await Promise.all([
        lockManager.withLock('/test/file1.txt', operation1),
        lockManager.withLock('/test/file2.txt', operation2),
      ])

      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
      expect(mockRelease1).toHaveBeenCalled()
      expect(mockRelease2).toHaveBeenCalled()
    })

    it('should handle sequential locks on same file', async () => {
      const mockRelease1 = jest.fn().mockResolvedValue(undefined)
      const mockRelease2 = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock
        .mockResolvedValueOnce(mockRelease1)
        .mockResolvedValueOnce(mockRelease2)

      const operation1 = jest.fn().mockResolvedValue('result1')
      const operation2 = jest.fn().mockResolvedValue('result2')

      const result1 = await lockManager.withLock('/test/file.txt', operation1)
      const result2 = await lockManager.withLock('/test/file.txt', operation2)

      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
      expect(mockRelease1).toHaveBeenCalled()
      expect(mockRelease2).toHaveBeenCalled()
    })
  })

  describe('lock options', () => {
    it('should use default options when none provided', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue('result')

      await lockManager.withLock('/test/file.txt', operation)

      expect(mockLockfile.lock).toHaveBeenCalledWith(
        '/test/file.txt',
        expect.objectContaining({
          retries: expect.objectContaining({
            retries: 5,
            minTimeout: 100,
            maxTimeout: 200,
          }),
          stale: 5000,
        })
      )
    })

    it('should merge custom options with defaults', async () => {
      const mockRelease = jest.fn().mockResolvedValue(undefined)
      mockLockfile.lock.mockResolvedValue(mockRelease)
      const operation = jest.fn().mockResolvedValue('result')

      await lockManager.withLock('/test/file.txt', operation, {
        timeout: 10000,
        retries: 3,
      })

      expect(mockLockfile.lock).toHaveBeenCalledWith(
        '/test/file.txt',
        expect.objectContaining({
          retries: expect.objectContaining({
            retries: 3,
          }),
          stale: 10000,
        })
      )
    })
  })
})
