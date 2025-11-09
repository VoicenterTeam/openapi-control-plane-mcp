/**
 * Metadata Type Definitions
 *
 * @description Types for version metadata, API metadata, audit events, and change summaries.
 * The bookkeeping types that make sure we know who changed what, when, and (hopefully) why.
 * Like a detective's notebook, but in TypeScript. 🕵️
 *
 * @module types/metadata
 */

import type { ApiId, VersionTag } from './openapi.js'

/**
 * Changes summary for version comparison
 * @description Tracks what changed between versions. The "before and after" photos of your API.
 */
export interface ChangesSummary {
  /** Endpoints that were added */
  endpoints_added: string[]
  /** Endpoints that were modified */
  endpoints_modified: string[]
  /** Endpoints that were deleted (RIP 🪦) */
  endpoints_deleted: string[]
  /** Schemas that were added */
  schemas_added: string[]
  /** Schemas that were modified */
  schemas_modified: string[]
  /** Schemas that were deleted */
  schemas_deleted: string[]
  /** Breaking changes detected (uh oh) */
  breaking_changes: string[]
}

/**
 * Validation results from Spectral and SwaggerParser
 * @description Like a report card for your OpenAPI spec
 */
export interface ValidationResults {
  /** Number of errors found */
  spectral_errors: number
  /** Number of warnings (yellow flags) */
  spectral_warnings: number
  /** Whether the spec is valid according to OpenAPI standard */
  openapi_valid: boolean
  /** Detailed validation messages */
  messages?: Array<{
    severity: 'error' | 'warning' | 'info' | 'hint'
    message: string
    path?: string
  }>
}

/**
 * Statistics about a spec version
 * @description Numbers that make managers happy
 */
export interface VersionStats {
  /** Total number of endpoints */
  endpoint_count: number
  /** Total number of schemas */
  schema_count: number
  /** File size in bytes */
  file_size_bytes: number
  /** Number of security schemes defined */
  security_schemes_count?: number
  /** Number of tags */
  tags_count?: number
}

/**
 * Metadata for a specific version of an API spec
 * @description Everything you need to know about a version, except why it was created at 3am
 */
export interface VersionMetadata {
  /** Version identifier (e.g., v1.2.3) */
  version: VersionTag
  /** When this version was created */
  created_at: string // ISO 8601 format
  /** Who created this version (email or username) */
  created_by: string
  /** The parent version this was based on */
  parent_version: VersionTag | null
  /** Human-readable description of changes */
  description: string
  /** Detailed summary of changes */
  changes: ChangesSummary
  /** Validation results for this version */
  validation: ValidationResults
  /** Statistics about this version */
  stats: VersionStats
  /** Optional tags (e.g., 'production', 'stable', 'beta') */
  tags?: string[]
}

/**
 * Metadata for an API (collection of versions)
 * @description The family tree of your API
 */
export interface ApiMetadata {
  /** Unique identifier for this API */
  api_id: ApiId
  /** Human-readable name */
  name: string
  /** When this API was first created */
  created_at: string // ISO 8601 format
  /** Current active version */
  current_version: VersionTag
  /** All available versions (sorted newest first) */
  versions: VersionTag[]
  /** Latest stable version */
  latest_stable: VersionTag
  /** Owner/team responsible for this API */
  owner: string
  /** Optional tags for organization */
  tags?: string[]
  /** Optional description */
  description?: string
}

/**
 * Audit event for tracking changes
 * @description The paper trail that saves you when someone asks "who broke production?"
 * Includes optional LLM reasoning for AI-driven changes.
 */
export interface AuditEvent {
  /** When the event occurred */
  timestamp: string // ISO 8601 format
  /** Type of event (version_created, endpoint_added, etc.) */
  event: string
  /** Which API was affected */
  api_id: ApiId
  /** Which version was affected (if applicable) */
  version?: VersionTag
  /** Who made the change (email, username, or 'llm:claude') */
  user: string
  /** Optional reason provided by LLM for why this change was made */
  llm_reason?: string
  /** Additional event-specific details */
  details?: Record<string, unknown>
}

/**
 * Filters for querying audit log
 * @description For when you need to find that one specific change in 10,000 events
 */
export interface AuditFilters {
  /** Filter by API ID */
  api_id?: ApiId
  /** Filter by version */
  version?: VersionTag
  /** Filter by user */
  user?: string
  /** Filter by event type */
  event?: string
  /** Filter events after this date */
  from_date?: string
  /** Filter events before this date */
  to_date?: string
  /** Maximum number of results */
  limit?: number
}

/**
 * Configuration for custom x- attributes
 * @description Tells the system which custom extensions are allowed and what they mean
 */
export interface CustomExtensionsConfig {
  /** Map of entity type to allowed attributes */
  attributes: {
    info?: Record<string, string> // attribute name -> description
    endpoint?: Record<string, string>
    parameter?: Record<string, string>
    schema?: Record<string, string>
    response?: Record<string, string>
    server?: Record<string, string>
    tag?: Record<string, string>
  }
}

/**
 * Parses custom x- attributes from environment variables
 * @param env - Environment variables object (defaults to process.env)
 * @returns Configuration object with parsed attributes
 * @description Converts X_ATTRIBUTE_ENTITY_NAME env vars into usable config.
 * Example: X_ATTRIBUTE_ENDPOINT_LOGO=Logo URL becomes endpoint.logo: 'Logo URL'
 */
export function parseCustomExtensionsConfig(
  env: Record<string, string | undefined> = process.env
): CustomExtensionsConfig {
  const config: CustomExtensionsConfig = {
    attributes: {},
  }

  const prefix = 'X_ATTRIBUTE_'
  Object.entries(env).forEach(([key, value]) => {
    if (!key.startsWith(prefix) || !value) return

    // Parse X_ATTRIBUTE_ENTITY_NAME format
    const parts = key.slice(prefix.length).toLowerCase().split('_')
    if (parts.length < 2) return

    const entity = parts[0] as keyof CustomExtensionsConfig['attributes']
    const attrName = parts.slice(1).join('_')

    if (!config.attributes[entity]) {
      config.attributes[entity] = {}
    }
    config.attributes[entity]![attrName] = value
  })

  return config
}

