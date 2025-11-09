/**
 * Logger Utility
 *
 * @description Structured logging with Pino. Because console.log is for amateurs,
 * and we're professionals here (who happen to enjoy the occasional joke). 📝
 *
 * @module utils/logger
 */

import pino from 'pino'
import type { Logger as PinoLogger } from 'pino'

/**
 * Configure logger based on environment
 * @returns Configured Pino logger instance
 * @description Creates a logger that's pretty in development and efficient in production.
 * Like Clark Kent transforming into Superman, but for logs.
 */
function createLogger(): PinoLogger {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const logLevel = process.env.LOG_LEVEL || 'info'

  return pino({
    level: logLevel,
    formatters: {
      level: label => ({ level: label.toUpperCase() }),
    },
    redact: {
      paths: [
        'password',
        'token',
        'apiKey',
        'api_key',
        'authorization',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.api_key',
      ],
      remove: true,
    },
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  })
}

// Export singleton logger instance
export const logger = createLogger()

/**
 * Logs a tool call with parameters
 * @param toolName - Name of the tool being called
 * @param params - Parameters passed to the tool
 * @description Logs tool invocations. Like a receptionist announcing visitors,
 * but for function calls.
 */
export function logToolCall(toolName: string, params: Record<string, unknown>): void {
  logger.info(
    {
      tool: toolName,
      params,
      event: 'tool_call',
    },
    `Tool called: ${toolName}`
  )
}

/**
 * Logs a storage operation
 * @param operation - Type of operation (read, write, delete, etc.)
 * @param path - Path being operated on
 * @param success - Whether the operation succeeded
 * @param error - Error if operation failed
 * @description Tracks file system operations. Your storage's black box recorder.
 */
export function logStorageOperation(
  operation: string,
  path: string,
  success: boolean,
  error?: Error
): void {
  const logFn = success ? logger.debug : logger.error
  logFn(
    {
      operation,
      path,
      success,
      error: error ? error.message : undefined,
      event: 'storage_operation',
    },
    `Storage ${operation}: ${path} - ${success ? 'success' : 'failed'}`
  )
}

/**
 * Logs a validation result
 * @param entity - What was validated (spec, params, etc.)
 * @param valid - Whether validation passed
 * @param errors - Validation errors if any
 * @description Logs validation outcomes. The quality control inspector's logbook.
 */
export function logValidation(
  entity: string,
  valid: boolean,
  errors?: Array<{ message: string; path?: string }>
): void {
  const logFn = valid ? logger.debug : logger.warn
  logFn(
    {
      entity,
      valid,
      errors,
      event: 'validation',
    },
    `Validation ${valid ? 'passed' : 'failed'}: ${entity}`
  )
}

/**
 * Adds a humorous message to logs (occasionally)
 * @param message - Base message
 * @returns Message with optional joke appended
 * @description Sprinkles in some levity. Because debugging is hard enough already.
 * Only triggers 10% of the time to avoid joke fatigue.
 */
export function addJoke(message: string): string {
  // Only add jokes 10% of the time
  if (Math.random() > 0.1) return message

  const jokes = [
    ' (No APIs were harmed in the making of this log)',
    ' (This log is 100% organic and gluten-free)',
    ' (Achievement unlocked: You read a log message!)',
    ' (Brought to you by the letters A, P, and I)',
    ' (In Soviet Russia, API logs YOU!)',
    ' (Warning: Reading logs may cause sudden understanding)',
  ]

  return `${message}${jokes[Math.floor(Math.random() * jokes.length)]}`
}

/**
 * Creates a child logger with additional context
 * @param context - Additional context fields
 * @returns Child logger with context
 * @description Creates a logger with baked-in context. Like a custom stamp,
 * but for log entries.
 */
export function createChildLogger(context: Record<string, unknown>): PinoLogger {
  return logger.child(context)
}

