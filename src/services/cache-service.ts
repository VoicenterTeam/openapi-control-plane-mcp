/**
 * Cache Service
 *
 * @description LRU cache with stale-while-revalidate pattern for optimal performance.
 * Provides manual invalidation and async background updates.
 *
 * @module services/cache-service
 */

import { LRUCache } from 'lru-cache'
import { logger } from '../utils/logger.js'

export interface CacheOptions {
  maxSize?: number // Max size in bytes (default: 500MB)
  ttl?: number // Time to live in ms (optional, we use manual invalidation)
}

export interface CacheStats {
  size: number
  keys: number
  hitRate: number
  hits: number
  misses: number
}

/**
 * Cache Service with LRU eviction and stale-while-revalidate
 */
export class CacheService {
  private cache: LRUCache<string, any>
  private updating: Map<string, Promise<any>> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
  }

  constructor(options: CacheOptions = {}) {
    const maxSize = options.maxSize || 500 * 1024 * 1024 // 500MB default

    this.cache = new LRUCache({
      max: 1000, // Max number of items
      maxSize,
      sizeCalculation: (value) => {
        // Estimate size of cached value
        return JSON.stringify(value).length
      },
      dispose: (_value, key) => {
        logger.debug({ key }, 'Cache entry evicted')
      },
    })

    logger.info({ maxSize: `${maxSize / 1024 / 1024}MB` }, 'CacheService initialized')
  }

  /**
   * Get value from cache with stale-while-revalidate pattern
   * @param key - Cache key
   * @param loader - Function to load fresh data
   * @returns Cached or freshly loaded value
   */
  async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)

    if (cached !== undefined) {
      this.stats.hits++
      logger.debug({ key, hit: true }, 'Cache hit')

      // Async revalidation in background (non-blocking)
      this.asyncUpdate(key, loader).catch((error) => {
        logger.error({ key, error }, 'Background cache update failed')
      })

      return cached as T
    }

    // Cache miss - load data
    this.stats.misses++
    logger.debug({ key, hit: false }, 'Cache miss')

    return this.update(key, loader)
  }

  /**
   * Force update cache entry (blocking)
   * @param key - Cache key
   * @param loader - Function to load fresh data
   * @returns Freshly loaded value
   */
  private async update<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // Check if already updating
    const existingUpdate = this.updating.get(key)
    if (existingUpdate) {
      return existingUpdate as Promise<T>
    }

    // Start update
    const updatePromise = loader()
      .then((value) => {
        this.cache.set(key, value)
        this.updating.delete(key)
        logger.debug({ key }, 'Cache updated')
        return value
      })
      .catch((error) => {
        this.updating.delete(key)
        logger.error({ key, error }, 'Cache update failed')
        throw error
      })

    this.updating.set(key, updatePromise)
    return updatePromise
  }

  /**
   * Async non-blocking cache update
   * @param key - Cache key
   * @param loader - Function to load fresh data
   */
  private async asyncUpdate<T>(key: string, loader: () => Promise<T>): Promise<void> {
    // Don't update if already updating
    if (this.updating.has(key)) {
      return
    }

    try {
      await this.update(key, loader)
    } catch (error) {
      // Errors are logged in update(), just swallow here
    }
  }

  /**
   * Invalidate cache entries matching pattern
   * @param pattern - String pattern (supports wildcards *) or RegExp
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
      : pattern

    const keysToDelete: string[] = []
    
    // Find matching keys
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    // Delete matched keys
    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.updating.delete(key) // Cancel any pending updates
    }

    if (keysToDelete.length > 0) {
      logger.debug(
        { pattern: pattern.toString(), count: keysToDelete.length },
        'Cache entries invalidated'
      )
    }
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear()
    this.updating.clear()
    logger.info('All cache entries invalidated')
  }

  /**
   * Set cache entry directly
   * @param key - Cache key
   * @param value - Value to cache
   */
  set(key: string, value: any): void {
    this.cache.set(key, value)
    logger.debug({ key }, 'Cache entry set')
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete specific cache entry
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.updating.delete(key)
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      size: this.cache.size,
      keys: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
    }
  }

  /**
   * Get cache size in bytes
   * @returns Estimated cache size
   */
  getSize(): number {
    return this.cache.calculatedSize || 0
  }

  /**
   * Get cache hit rate
   * @returns Hit rate as decimal (0-1)
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Get number of keys in cache
   * @returns Number of cached keys
   */
  getKeyCount(): number {
    return this.cache.size
  }

  /**
   * Warm cache with initial data
   * @param warmers - Array of functions to warm cache
   */
  async warmCache(warmers: Array<() => Promise<void>>): Promise<void> {
    logger.info({ count: warmers.length }, 'Warming cache...')
    
    const start = Date.now()
    
    try {
      await Promise.all(warmers.map((warmer) => warmer()))
      
      const duration = Date.now() - start
      const stats = this.getStats()
      
      logger.info(
        {
          duration: `${duration}ms`,
          keys: stats.keys,
          size: `${(this.getSize() / 1024 / 1024).toFixed(2)}MB`,
        },
        'Cache warming completed'
      )
    } catch (error) {
      logger.error({ error }, 'Cache warming failed')
      throw error
    }
  }
}

