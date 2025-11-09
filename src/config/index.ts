/**
 * Configuration Management
 *
 * @description Loads and validates configuration from environment variables.
 * Because hardcoding values is so 2010. Also, it makes your security team cry. 😢
 *
 * @module config
 */

import { config as dotenvConfig } from 'dotenv'
import { z } from 'zod'
import { parseCustomExtensionsConfig } from '../types/metadata'

// Load .env file
dotenvConfig()

/**
 * Configuration schema using Zod
 * @description Validates all environment variables and provides defaults
 */
const configSchema = z.object({
  // Server config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Storage config
  DATA_DIR: z.string().default('./data'),
  BACKUP_DIR: z.string().default('./backups'),

  // Logging config
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Features (future use)
  ENABLE_GIT_INTEGRATION: z.coerce.boolean().default(false),
  AUTO_BACKUP_INTERVAL: z.coerce.number().default(3600), // seconds

  // Authentication (future use)
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWKS_URL: z.string().url().optional(),
})

/**
 * Parsed and validated configuration
 * @description Type-safe access to all config values
 */
export type Config = z.infer<typeof configSchema>

/**
 * Parse and validate configuration
 * @throws Error if validation fails
 * @description Loads config from environment, validates it, and provides defaults.
 * If this fails, your environment is misconfigured and you should feel bad.
 */
function loadConfig(): Config {
  try {
    return configSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:')
      console.error(JSON.stringify(error.errors, null, 2))
      throw new Error('Invalid configuration. Check your .env file.')
    }
    throw error
  }
}

// Export singleton config instance
export const config = loadConfig()

// Export custom extensions config
export const customExtensions = parseCustomExtensionsConfig()

/**
 * Gets a custom x- attribute description for an entity/attribute combination
 * @param entity - Entity type (info, endpoint, parameter, etc.)
 * @param attributeName - Attribute name (without x- prefix)
 * @returns Description string or undefined if not configured
 * @description Helper to look up custom attribute descriptions
 */
export function getCustomAttributeDescription(
  entity: string,
  attributeName: string
): string | undefined {
  const entityAttrs = customExtensions.attributes[entity as keyof typeof customExtensions.attributes]
  if (!entityAttrs) return undefined
  return entityAttrs[attributeName]
}

