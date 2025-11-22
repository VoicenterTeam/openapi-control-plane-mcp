/**
 * Health Check Route
 *
 * @description Provides health status endpoint for monitoring and load balancers.
 *
 * @module routes/health
 */

import type { FastifyInstance } from 'fastify'
import type { CacheService } from '../services/cache-service.js'
import { config } from '../config/index.js'
import { promises as fs } from 'fs'

export interface HealthRouteOptions {
  cache: CacheService
}

/**
 * Register health check route
 * @param fastify - Fastify instance
 * @param options - Route options
 */
export async function healthRoute(fastify: FastifyInstance, options: HealthRouteOptions) {
  const { cache } = options

  fastify.get('/api/health', async (_request, reply) => {
    try {
      // Check storage accessibility
      const storageAccessible = await checkStorageAccessible(config.DATA_DIR)
      
      // Get cache stats
      const cacheStats = cache.getStats()
      
      // Determine overall status
      const status = storageAccessible ? 'healthy' : 'degraded'
      
      const health = {
        status,
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        storage: {
          type: 'file',
          path: config.DATA_DIR,
          accessible: storageAccessible,
        },
        cache: {
          size: cache.getSize(),
          hitRate: cache.getHitRate(),
          keys: cache.getKeyCount(),
          hits: cacheStats.hits,
          misses: cacheStats.misses,
        },
        mcp_server: 'running',
        uptime: process.uptime(),
        memory: {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          rss: process.memoryUsage().rss,
        },
      }

      reply.send(health)
    } catch (error) {
      reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      })
    }
  })
}

/**
 * Check if storage is accessible
 * @param dataDir - Data directory path
 * @returns True if accessible
 */
async function checkStorageAccessible(dataDir: string): Promise<boolean> {
  try {
    await fs.access(dataDir)
    return true
  } catch {
    return false
  }
}

