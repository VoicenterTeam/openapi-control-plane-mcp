/**
 * Error Handler Middleware
 *
 * @description Global error handler with exception tracking.
 *
 * @module middleware/error-handler
 */

import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify'
import type { MetricsService } from '../services/metrics-service.js'
import { logger } from '../utils/logger.js'

/**
 * Create error handler middleware
 * @param metrics - MetricsService instance
 * @returns Fastify error handler function
 */
export function createErrorHandler(metrics: MetricsService) {
  return async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Record exception metrics
    metrics.recordException(
      error.constructor.name,
      request.url,
      error
    )

    // Log error with context
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        statusCode: error.statusCode || 500,
      },
      'Request error'
    )

    // Send error response
    const statusCode = error.statusCode || 500
    const response = {
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    }

    reply.code(statusCode).send(response)
  }
}

