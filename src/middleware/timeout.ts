/**
 * Timeout Middleware
 *
 * @description Enforces request timeouts to prevent long-running requests.
 *
 * @module middleware/timeout
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger.js'

/**
 * Create timeout middleware
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Fastify hook function
 */
export function createTimeoutMiddleware(timeoutMs: number = 30000) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let timeoutId: NodeJS.Timeout | null = null
    let isTimedOut = false

    // Set timeout
    timeoutId = setTimeout(() => {
      isTimedOut = true
      
      if (!reply.sent) {
        logger.warn(
          {
            url: request.url,
            method: request.method,
            timeout: timeoutMs,
          },
          'Request timeout'
        )
        
        reply.code(408).send({
          error: 'Request Timeout',
          message: `Request exceeded ${timeoutMs}ms timeout`,
          statusCode: 408,
        })
      }
    }, timeoutMs)

    // Clear timeout when response is sent
    reply.raw.on('finish', () => {
      if (timeoutId && !isTimedOut) {
        clearTimeout(timeoutId)
      }
    })
  }
}

