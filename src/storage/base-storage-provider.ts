/**
 * Base Storage Provider
 *
 * @description Abstract base class for storage providers. Want to switch from
 * file system to S3 or Redis? Just implement this interface and you're golden.
 * It's like Lego blocks, but for data persistence. 🧱
 *
 * @module storage/base-storage-provider
 */

/**
 * Configuration for storage providers
 * @description Common config that all storage providers might need
 */
export interface StorageConfig {
  /** Base path/directory/bucket for storage */
  basePath: string
  /** Optional timeout for operations (in milliseconds) */
  timeout?: number
  /** Additional provider-specific options */
  options?: Record<string, unknown>
}

/**
 * Abstract base class for storage providers
 * @description The contract that all storage providers must fulfill.
 * Implement these methods and you can store data anywhere - file system,
 * S3, Redis, carrier pigeons, you name it. 📦
 *
 * @abstract
 */
export abstract class BaseStorageProvider {
  protected config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
  }

  /**
   * Reads data from storage
   * @param key - Storage key/path to read from
   * @returns Promise resolving to the data as string
   * @throws StorageError if read fails
   * @description Retrieves data. Like asking a librarian for a book,
   * but digital and without the judgmental looks.
   */
  abstract read(key: string): Promise<string>

  /**
   * Writes data to storage
   * @param key - Storage key/path to write to
   * @param data - Data to write (as string)
   * @returns Promise resolving when write completes
   * @throws StorageError if write fails
   * @description Saves data. Hopefully permanently, but no promises
   * if cosmic rays decide to flip some bits.
   */
  abstract write(key: string, data: string): Promise<void>

  /**
   * Checks if a key exists in storage
   * @param key - Storage key/path to check
   * @returns Promise resolving to true if exists, false otherwise
   * @description The "are you there?" check. Like calling someone's name
   * in an empty house, but less creepy.
   */
  abstract exists(key: string): Promise<boolean>

  /**
   * Deletes data from storage
   * @param key - Storage key/path to delete
   * @returns Promise resolving when deletion completes
   * @throws StorageError if deletion fails
   * @description Removes data permanently. Use with caution - there's
   * no "undo" button here.
   */
  abstract delete(key: string): Promise<void>

  /**
   * Lists all keys with a given prefix
   * @param prefix - Prefix to filter keys (e.g., 'apis/' or 'versions/')
   * @returns Promise resolving to array of matching keys
   * @throws StorageError if listing fails
   * @description Gets a directory listing. The "show me what you got"
   * of storage operations.
   */
  abstract list(prefix: string): Promise<string[]>

  /**
   * Ensures a directory/path exists (creates if needed)
   * @param path - Directory path to ensure exists
   * @returns Promise resolving when directory is confirmed to exist
   * @throws StorageError if creation fails
   * @description Makes sure a location exists. Like calling ahead to
   * make sure the restaurant is actually open.
   */
  abstract ensureDirectory(path: string): Promise<void>

  /**
   * Gets the full path for a key
   * @param key - Relative key
   * @returns Full path including base path
   * @description Helper to construct full paths. Joins basePath with key
   * in a provider-appropriate way.
   */
  protected getFullPath(key: string): string {
    // Remove leading slash from key if present
    const cleanKey = key.startsWith('/') ? key.slice(1) : key
    // Join with base path (implementation varies by provider)
    return `${this.config.basePath}/${cleanKey}`
  }

  /**
   * Validates a storage key format
   * @param key - Key to validate
   * @throws Error if key format is invalid
   * @description Ensures keys don't contain forbidden characters or patterns.
   * Because "../../../etc/passwd" is not a valid storage key, hacker.
   */
  protected validateKey(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new Error('Storage key cannot be empty')
    }

    // Check for directory traversal attempts
    if (key.includes('..')) {
      throw new Error('Storage key cannot contain ".." (directory traversal attempt)')
    }

    // Check for absolute paths
    if (key.startsWith('/') && key.length > 1) {
      // Leading slash is OK for root-relative keys, but not absolute system paths
      if (key.startsWith('//') || key.match(/^\/[a-zA-Z]:\//)) {
        throw new Error('Storage key cannot be an absolute system path')
      }
    }
  }
}

