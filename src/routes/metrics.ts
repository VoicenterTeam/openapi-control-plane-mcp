/**
 * Metrics Route
 *
 * @description Exposes Prometheus metrics endpoint.
 *
 * @module routes/metrics
 */

import type { FastifyInstance } from 'fastify'
import type { MetricsService } from '../services/metrics-service.js'

export interface MetricsRouteOptions {
  metrics: MetricsService
}

/**
 * Register metrics route
 * @param fastify - Fastify instance
 * @param options - Route options
 */
export async function metricsRoute(fastify: FastifyInstance, options: MetricsRouteOptions) {
  const { metrics } = options

  fastify.get('/api/metrics', async (_request, reply) => {
    try {
      const metricsData = await metrics.getMetrics()
      reply.type('text/plain').send(metricsData)
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to retrieve metrics',
        message: (error as Error).message,
      })
    }
  })
}

