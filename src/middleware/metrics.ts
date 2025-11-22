/**
 * Metrics Middleware
 *
 * @description Tracks HTTP request metrics (count, duration, status codes).
 *
 * @module middleware/metrics
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { MetricsService } from '../services/metrics-service.js'

/**
 * Create metrics middleware
 * @param metrics - MetricsService instance
 * @returns Fastify hook function
 */
export function createMetricsMiddleware(metrics: MetricsService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now()

    reply.raw.on('finish', () => {
      const duration = Date.now() - start
      const endpoint = sanitizeEndpoint(request.url)
      
      metrics.recordRequest(
        endpoint,
        request.method,
        reply.statusCode,
        duration
      )
    })
  }
}

/**
 * Sanitize endpoint for metrics (remove IDs and query params)
 * @param url - Request URL
 * @returns Sanitized endpoint path
 */
function sanitizeEndpoint(url: string): string {
  // Remove query parameters
  const path = url.split('?')[0]
  
  // Replace UUIDs and version tags with placeholders
  return path
    .replace(/\/v\d+\.\d+\.\d+/g, '/:version')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/[a-z0-9-]{20,}/gi, '/:id')
}

