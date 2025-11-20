/**
 * API Type Definitions
 * 
 * @description TypeScript types matching backend API responses.
 * Mirrors types from src/types/ in the backend.
 */

/**
 * API identifier type
 */
export type ApiId = string

/**
 * Version tag type (e.g., 'v1.0.0')
 */
export type VersionTag = string

/**
 * Changes summary for version comparison
 */
export interface ChangesSummary {
  endpoints_added: string[]
  endpoints_modified: string[]
  endpoints_deleted: string[]
  schemas_added: string[]
  schemas_modified: string[]
  schemas_deleted: string[]
  breaking_changes: string[]
}

/**
 * Validation results
 */
export interface ValidationResults {
  spectral_errors: number
  spectral_warnings: number
  openapi_valid: boolean
  messages?: Array<{
    severity: 'error' | 'warning' | 'info' | 'hint'
    message: string
    path?: string
  }>
}

/**
 * Version statistics
 */
export interface VersionStats {
  endpoint_count: number
  schema_count: number
  file_size_bytes: number
  security_schemes_count?: number
  tags_count?: number
}

/**
 * Version metadata
 */
export interface VersionMetadata {
  version: VersionTag
  created_at: string
  created_by: string
  parent_version: VersionTag | null
  description: string
  changes: ChangesSummary
  validation: ValidationResults
  stats: VersionStats
  tags?: string[]
}

/**
 * Folder metadata for organizing API specs
 */
export interface FolderMetadata {
  name: string
  title: string
  description?: string
  color?: string
  icon?: string
  created_at: string
  created_by?: string
  spec_count?: number
}

/**
 * API metadata
 */
export interface ApiMetadata {
  api_id: ApiId
  name: string
  created_at: string
  current_version: VersionTag
  versions: VersionTag[]
  latest_stable: VersionTag
  owner: string
  tags?: string[]
  description?: string
  folder?: string
}

/**
 * Audit event
 */
export interface AuditEvent {
  timestamp: string
  event: string
  api_id: ApiId
  version?: VersionTag
  user: string
  llm_reason?: string
  details?: Record<string, unknown>
}

/**
 * OpenAPI specification
 */
export interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
    contact?: {
      name?: string
      email?: string
      url?: string
    }
    [key: string]: any
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, SchemaObject>
    responses?: Record<string, ResponseObject>
    parameters?: Record<string, ParameterObject>
    securitySchemes?: Record<string, SecuritySchemeObject>
    [key: string]: any
  }
  tags?: Array<{
    name: string
    description?: string
  }>
  [key: string]: any
}

/**
 * Path item (endpoint)
 */
export interface PathItem {
  summary?: string
  description?: string
  get?: OperationObject
  post?: OperationObject
  put?: OperationObject
  patch?: OperationObject
  delete?: OperationObject
  options?: OperationObject
  head?: OperationObject
  [key: string]: any
}

/**
 * Operation object
 */
export interface OperationObject {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses: Record<string, ResponseObject>
  security?: Array<Record<string, string[]>>
  [key: string]: any
}

/**
 * Parameter object
 */
export interface ParameterObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  required?: boolean
  description?: string
  schema?: SchemaObject
  [key: string]: any
}

/**
 * Request body object
 */
export interface RequestBodyObject {
  description?: string
  required?: boolean
  content: Record<string, MediaTypeObject>
  [key: string]: any
}

/**
 * Media type object
 */
export interface MediaTypeObject {
  schema?: SchemaObject
  example?: any
  examples?: Record<string, any>
  [key: string]: any
}

/**
 * Response object
 */
export interface ResponseObject {
  description: string
  content?: Record<string, MediaTypeObject>
  headers?: Record<string, any>
  [key: string]: any
}

/**
 * Schema object
 */
export interface SchemaObject {
  type?: string
  format?: string
  description?: string
  properties?: Record<string, SchemaObject>
  items?: SchemaObject
  required?: string[]
  enum?: any[]
  $ref?: string
  [key: string]: any
}

/**
 * Security scheme object
 */
export interface SecuritySchemeObject {
  type: string
  description?: string
  name?: string
  in?: string
  scheme?: string
  bearerFormat?: string
  flows?: any
  openIdConnectUrl?: string
  [key: string]: any
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  total_specs: number
  total_versions: number
  total_endpoints: number
  total_schemas: number
  recent_changes: Array<{
    timestamp: string
    api_id: ApiId
    event: string
    version?: VersionTag
  }>
  specs_by_tag: Record<string, number>
  breaking_changes_count: number
  versions_this_week: number
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

