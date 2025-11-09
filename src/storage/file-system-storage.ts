/**
 * File System Storage Provider
 *
 * @description Implementation of BaseStorageProvider using the file system.
 * Because sometimes the best database is just... a folder full of files.
 * Simple, reliable, and debuggable with `ls`. 📁
 *
 * @module storage/file-system-storage
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import { BaseStorageProvider, type StorageConfig } from './base-storage-provider.js'
import { createStorageError } from '../utils/errors.js'
import { logStorageOperation } from '../utils/logger.js'

/**
 * File system storage provider
 * @description Stores data as files on disk. Old school cool.
 * Works great until you need to scale to multiple servers, then it's S3 time.
 */
export class FileSystemStorage extends BaseStorageProvider {
  constructor(config: StorageConfig) {
    super(config)
  }

  /**
   * Reads a file from disk
   * @param key - File path relative to base directory
   * @returns Promise resolving to file contents as string
   * @throws StorageError if file doesn't exist or can't be read
   */
  async read(key: string): Promise<string> {
    this.validateKey(key)
    const fullPath = this.getFullPath(key)

    try {
      const data = await fs.readFile(fullPath, 'utf-8')
      logStorageOperation('read', fullPath, true)
      return data
    } catch (error) {
      logStorageOperation('read', fullPath, false, error as Error)
      throw createStorageError(
        `Failed to read file: ${fullPath}`,
        fullPath,
        'read',
        error as Error
      )
    }
  }

  /**
   * Writes data to a file atomically
   * @param key - File path relative to base directory
   * @param data - Data to write
   * @description Uses atomic write pattern: write to temp file, then rename.
   * This ensures the file is never in a partially-written state. Like a
   * transaction, but for files.
   */
  async write(key: string, data: string): Promise<void> {
    this.validateKey(key)
    const fullPath = this.getFullPath(key)

    // Ensure parent directory exists
    const dir = path.dirname(fullPath)
    await this.ensureDirectory(dir)

    // Atomic write: temp file + rename
    const tempPath = `${fullPath}.tmp.${Date.now()}`

    try {
      // Write to temp file
      await fs.writeFile(tempPath, data, 'utf-8')

      // Atomic rename
      await fs.rename(tempPath, fullPath)

      logStorageOperation('write', fullPath, true)
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }

      logStorageOperation('write', fullPath, false, error as Error)
      throw createStorageError(
        `Failed to write file: ${fullPath}`,
        fullPath,
        'write',
        error as Error
      )
    }
  }

  /**
   * Checks if a file exists
   * @param key - File path relative to base directory
   * @returns Promise resolving to true if file exists
   */
  async exists(key: string): Promise<boolean> {
    this.validateKey(key)
    const fullPath = this.getFullPath(key)

    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Deletes a file
   * @param key - File path relative to base directory
   * @throws StorageError if deletion fails
   */
  async delete(key: string): Promise<void> {
    this.validateKey(key)
    const fullPath = this.getFullPath(key)

    try {
      await fs.unlink(fullPath)
      logStorageOperation('delete', fullPath, true)
    } catch (error) {
      logStorageOperation('delete', fullPath, false, error as Error)
      throw createStorageError(
        `Failed to delete file: ${fullPath}`,
        fullPath,
        'delete',
        error as Error
      )
    }
  }

  /**
   * Lists all files matching a prefix
   * @param prefix - Directory prefix to search
   * @returns Promise resolving to array of relative file paths
   */
  async list(prefix: string): Promise<string[]> {
    const fullPath = this.getFullPath(prefix)

    try {
      const files = await this.listRecursive(fullPath)
      // Return paths relative to base path
      return files.map(f => path.relative(this.config.basePath, f))
    } catch (error) {
      logStorageOperation('list', fullPath, false, error as Error)
      throw createStorageError(
        `Failed to list files in: ${fullPath}`,
        fullPath,
        'list',
        error as Error
      )
    }
  }

  /**
   * Recursively lists all files in a directory
   * @param dir - Directory to list
   * @returns Array of absolute file paths
   * @private
   */
  private async listRecursive(dir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const files: string[] = []

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          const subFiles = await this.listRecursive(fullPath)
          files.push(...subFiles)
        } else {
          files.push(fullPath)
        }
      }

      return files
    } catch (error) {
      // If directory doesn't exist, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - Directory path (can be relative or absolute)
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      throw createStorageError(
        `Failed to create directory: ${dirPath}`,
        dirPath,
        'write',
        error as Error
      )
    }
  }

  /**
   * Gets the full file system path for a key
   * @param key - Relative key
   * @returns Absolute file system path
   * @override
   */
  protected getFullPath(key: string): string {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key
    return path.join(this.config.basePath, cleanKey)
  }
}

