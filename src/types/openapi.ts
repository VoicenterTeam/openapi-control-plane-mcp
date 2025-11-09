/**
 * OpenAPI Type Definitions
 *
 * @description This file contains TypeScript types and type guards for working
 * with OpenAPI specifications across different versions (Swagger 2.0, OpenAPI 3.0, 3.1).
 * Think of it as the Rosetta Stone for translating between API spec dialects. 🗿
 *
 * @module types/openapi
 */

import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

/**
 * Branded type for API identifiers
 * @description A string that's definitely an API ID, not just any random string
 * wandering around claiming to be one.
 */
export type ApiId = string & { readonly __brand: 'ApiId' }

/**
 * Branded type for version tags
 * @description Like a name tag at a conference, but for API versions. "Hello, my name is v1.2.3"
 */
export type VersionTag = string & { readonly __brand: 'VersionTag' }

/**
 * Discriminated union for OpenAPI documents
 * @description Handles different OpenAPI versions with type safety.
 * Because mixing up versions is like mixing up Star Wars and Star Trek - technically possible, but painful.
 */
export type OpenAPIDocument =
  | { version: '3.0'; spec: OpenAPIV3.Document }
  | { version: '3.1'; spec: OpenAPIV3_1.Document }
  | { version: '2.0'; spec: SwaggerV2Document }

/**
 * Swagger 2.0 Document interface
 * @description For the OG OpenAPI spec. Old but gold, like a Nokia 3310.
 */
export interface SwaggerV2Document {
  swagger: '2.0'
  info: {
    title: string
    version: string
    description?: string
    [key: string]: unknown
  }
  host?: string
  basePath?: string
  schemes?: string[]
  paths?: Record<string, unknown>
  definitions?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Type guard to check if spec is OpenAPI 3.0
 * @param spec - The spec to check
 * @returns True if the spec is OpenAPI 3.0
 * @description Checks if your spec speaks the OpenAPI 3.0 dialect
 */
export function isOpenAPI30(spec: unknown): spec is OpenAPIV3.Document {
  return (
    typeof spec === 'object' &&
    spec !== null &&
    'openapi' in spec &&
    typeof spec.openapi === 'string' &&
    spec.openapi.startsWith('3.0')
  )
}

/**
 * Type guard to check if spec is OpenAPI 3.1
 * @param spec - The spec to check
 * @returns True if the spec is OpenAPI 3.1
 * @description The newest kid on the block. JSON Schema compatible and ready to party.
 */
export function isOpenAPI31(spec: unknown): spec is OpenAPIV3_1.Document {
  return (
    typeof spec === 'object' &&
    spec !== null &&
    'openapi' in spec &&
    typeof spec.openapi === 'string' &&
    spec.openapi.startsWith('3.1')
  )
}

/**
 * Type guard to check if spec is Swagger 2.0
 * @param spec - The spec to check
 * @returns True if the spec is Swagger 2.0
 * @description Checks if your spec is speaking the ancient tongue of Swagger 2.0
 */
export function isSwagger20(spec: unknown): spec is SwaggerV2Document {
  return (
    typeof spec === 'object' &&
    spec !== null &&
    'swagger' in spec &&
    typeof spec.swagger === 'string' &&
    spec.swagger === '2.0'
  )
}

/**
 * Detects the OpenAPI version of a specification
 * @param spec - The specification object
 * @returns The version string ('2.0', '3.0', or '3.1')
 * @throws Error if version cannot be determined
 * @description Like a sommelier identifying wine, but for API specs
 */
export function detectOpenAPIVersion(spec: unknown): '2.0' | '3.0' | '3.1' {
  if (isSwagger20(spec)) return '2.0'
  if (isOpenAPI30(spec)) return '3.0'
  if (isOpenAPI31(spec)) return '3.1'
  throw new Error('Unknown or unsupported OpenAPI version')
}

/**
 * Creates a branded ApiId from a string
 * @param id - The string to brand as an ApiId
 * @returns A branded ApiId
 * @throws Error if the ID format is invalid
 * @description Validates and brands a string as an API ID. Like a bouncer checking IDs,
 * but for API identifiers. Must be lowercase alphanumeric with hyphens.
 */
export function createApiId(id: string): ApiId {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error(
      `Invalid API ID format: "${id}". Must be lowercase alphanumeric with hyphens only.`
    )
  }
  return id as ApiId
}

/**
 * Creates a branded VersionTag from a string
 * @param version - The version string to brand
 * @returns A branded VersionTag
 * @throws Error if the version format is invalid
 * @description Validates version format (semantic versioning or timestamp).
 * Accepts v1.2.3 (semver) or v20250109-120000 (timestamp).
 */
export function createVersionTag(version: string): VersionTag {
  // Semver format: v1.2.3
  const semverPattern = /^v\d+\.\d+\.\d+$/
  // Timestamp format: v20250109-120000
  const timestampPattern = /^v\d{8}-\d{6}$/

  if (!semverPattern.test(version) && !timestampPattern.test(version)) {
    throw new Error(
      `Invalid version format: "${version}". Must be semantic (v1.2.3) or timestamp (v20250109-120000).`
    )
  }
  return version as VersionTag
}

