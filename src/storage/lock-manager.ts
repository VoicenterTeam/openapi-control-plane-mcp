/**
 * Lock Manager
 *
 * @description Manages file locks to prevent concurrent access issues.
 * Because two processes writing to the same file at the same time is like
 * two people trying to use the same door - someone's getting hurt. 🔒
 *
 * @module storage/lock-manager
 */

import lockfile from 'proper-lockfile'
import { createStorageError } from '../utils/errors'
import { logger } from '../utils/logger'

/**
 * Options for lock acquisition
 */
export interface LockOptions {
  /** How long to wait for lock before giving up (ms) */
  timeout?: number
  /** Number of retry attempts */
  retries?: number
  /** Time between retries (ms) */
  retryInterval?: number
}

/**
 * Default lock options
 */
const DEFAULT_LOCK_OPTIONS: Required<LockOptions> = {
  timeout: 5000, // 5 seconds
  retries: 5,
  retryInterval: 100, // 100ms
}

/**
 * Release function type
 */
type ReleaseLock = () => Promise<void>

/**
 * Lock Manager class
 * @description Handles file locking using proper-lockfile. Like a bouncer for your files.
 */
export class LockManager {
  /**
   * Executes an operation with a file lock
   * @param filePath - Path to the file to lock
   * @param operation - Async operation to perform while holding the lock
   * @param options - Lock options
   * @returns Promise resolving to the operation result
   * @throws StorageError if lock can't be acquired or operation fails
   * @description The "do this safely" wrapper. Acquires lock, runs your code,
   * releases lock. Even if your code throws a tantrum, the lock gets released.
   *
   * @example
   * ```typescript
   * const result = await lockManager.withLock('myfile.txt', async () => {
   *   // Read, modify, write...
   *   return 'success'
   * })
   * ```
   */
  async withLock<T>(
    filePath: string,
    operation: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lockOpts = { ...DEFAULT_LOCK_OPTIONS, ...options }
    let release: ReleaseLock | null = null

    try {
      // Acquire lock
      logger.debug({ filePath, options: lockOpts }, 'Acquiring file lock')

      release = await lockfile.lock(filePath, {
        retries: {
          retries: lockOpts.retries,
          minTimeout: lockOpts.retryInterval,
          maxTimeout: lockOpts.retryInterval * 2,
        },
        stale: lockOpts.timeout,
      })

      logger.debug({ filePath }, 'Lock acquired')

      // Execute operation
      const result = await operation()

      logger.debug({ filePath }, 'Operation completed successfully')

      return result
    } catch (error) {
      // Check if it's a lock timeout
      if (error instanceof Error && error.message.includes('Lock')) {
        throw createStorageError(
          `Failed to acquire lock for file: ${filePath}. File may be in use.`,
          filePath,
          'write',
          error
        )
      }

      // Otherwise, it's an operation error
      throw error
    } finally {
      // Always release lock if acquired
      if (release) {
        try {
          await release()
          logger.debug({ filePath }, 'Lock released')
        } catch (releaseError) {
          // Log but don't throw - operation already completed or failed
          logger.warn(
            { filePath, error: releaseError },
            'Warning: Failed to release lock (may have been released already)'
          )
        }
      }
    }
  }

  /**
   * Checks if a file is currently locked
   * @param filePath - Path to the file to check
   * @returns Promise resolving to true if file is locked
   * @description The "is anyone home?" check. Non-blocking.
   */
  async isLocked(filePath: string): Promise<boolean> {
    try {
      return await lockfile.check(filePath)
    } catch {
      // If check fails, assume not locked
      return false
    }
  }

  /**
   * Forcefully removes a lock file
   * @param filePath - Path to the file to unlock
   * @throws StorageError if unlock fails
   * @description The emergency "break glass in case of fire" option.
   * Use with extreme caution - only when you're sure the lock is stale.
   *
   * **WARNING**: This can cause data corruption if the file is actually
   * in use by another process. Only use if you're absolutely certain
   * the lock is orphaned.
   */
  async forceUnlock(filePath: string): Promise<void> {
    try {
      logger.warn({ filePath }, 'Force unlocking file (this should be rare!)')
      await lockfile.unlock(filePath)
      logger.info({ filePath }, 'File forcefully unlocked')
    } catch (error) {
      throw createStorageError(
        `Failed to force unlock file: ${filePath}`,
        filePath,
        'write',
        error as Error
      )
    }
  }
}

// Export singleton instance
export const lockManager = new LockManager()

