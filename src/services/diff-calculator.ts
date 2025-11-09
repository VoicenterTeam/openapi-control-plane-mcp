/**
 * Diff Calculator Service
 *
 * @description Compares two OpenAPI specifications and identifies differences.
 * Like a detective, but for API changes. Finds what changed, where, and why you should care. 🔍📊
 *
 * @module services/diff-calculator
 */

import type { OpenAPIDocument } from '../types/openapi.js'
import type { ChangesSummary } from '../types/metadata.js'
import { logger } from '../utils/logger.js'

/**
 * Detailed difference between two specs
 * @description The full report of what changed. Every detail matters.
 */
export interface SpecDiff {
  /** Summary of changes */
  summary: ChangesSummary
  /** Endpoints that were added with their methods */
  endpoints_added_detail: Array<{ path: string; methods: string[] }>
  /** Endpoints that were removed with their methods */
  endpoints_removed_detail: Array<{ path: string; methods: string[] }>
  /** Endpoints that were modified */
  endpoints_modified_detail: Array<{
    path: string
    method: string
    changes: string[]
  }>
  /** Schemas that were added with details */
  schemas_added_detail: Array<{ name: string; type: string }>
  /** Schemas that were removed */
  schemas_removed_detail: Array<{ name: string }>
  /** Potentially breaking changes detected */
  breaking_changes: string[]
}

/**
 * Diff Calculator Service
 * @description Calculates differences between OpenAPI specifications.
 * The spec archaeologist. Uncovers what changed between versions. 🏛️
 */
export class DiffCalculator {
  /**
   * Calculates the diff between two OpenAPI specifications
   * @param oldSpec - The earlier/previous specification
   * @param newSpec - The later/current specification
   * @returns Detailed diff information
   * @description Compares specs and reports all differences. The full autopsy.
   */
  calculateDiff(oldSpec: OpenAPIDocument, newSpec: OpenAPIDocument): SpecDiff {
    logger.info('Calculating spec diff')

    const oldPaths = this.extractPaths(oldSpec)
    const newPaths = this.extractPaths(newSpec)

    const oldSchemas = this.extractSchemas(oldSpec)
    const newSchemas = this.extractSchemas(newSpec)

    // Calculate endpoint changes
    const addedEndpoints = this.getAddedEndpoints(oldPaths, newPaths)
    const removedEndpoints = this.getRemovedEndpoints(oldPaths, newPaths)
    const modifiedEndpoints = this.getModifiedEndpoints(oldPaths, newPaths)

    // Calculate schema changes
    const addedSchemas = this.getAddedSchemas(oldSchemas, newSchemas)
    const removedSchemas = this.getRemovedSchemas(oldSchemas, newSchemas)
    const modifiedSchemas = this.getModifiedSchemas(oldSchemas, newSchemas)

    // Detect breaking changes
    const breakingChanges = this.detectBreakingChanges(
      removedEndpoints,
      modifiedEndpoints,
      removedSchemas,
      modifiedSchemas
    )

    const summary: ChangesSummary = {
      endpoints_added: addedEndpoints.map((e) => `${e.methods.join(',')} ${e.path}`),
      endpoints_modified: modifiedEndpoints.map((e) => `${e.method} ${e.path}`),
      endpoints_deleted: removedEndpoints.map((e) => `${e.methods.join(',')} ${e.path}`),
      schemas_added: addedSchemas.map((s) => s.name),
      schemas_modified: modifiedSchemas,
      schemas_deleted: removedSchemas.map((s) => s.name),
      breaking_changes: breakingChanges,
    }

    logger.info({ summary }, 'Diff calculation complete')

    return {
      summary,
      endpoints_added_detail: addedEndpoints,
      endpoints_removed_detail: removedEndpoints,
      endpoints_modified_detail: modifiedEndpoints,
      schemas_added_detail: addedSchemas,
      schemas_removed_detail: removedSchemas,
      breaking_changes: breakingChanges,
    }
  }

  /**
   * Extracts all paths from a spec
   * @param spec - OpenAPI specification
   * @returns Map of paths to their operations
   * @description Gets all the endpoints. The API's address book.
   */
  private extractPaths(spec: OpenAPIDocument): Map<string, Record<string, any>> {
    const paths = new Map<string, Record<string, any>>()

    // Get the actual spec object
    const actualSpec = 'spec' in spec ? spec.spec : spec

    if (!('paths' in actualSpec) || !actualSpec.paths) {
      return paths
    }

    Object.entries(actualSpec.paths).forEach(([path, pathItem]) => {
      if (pathItem && typeof pathItem === 'object') {
        paths.set(path, pathItem as Record<string, any>)
      }
    })

    return paths
  }

  /**
   * Extracts all schemas from a spec
   * @param spec - OpenAPI specification
   * @returns Map of schema names to their definitions
   * @description Gets all the data models. The API's dictionary.
   */
  private extractSchemas(spec: OpenAPIDocument): Map<string, any> {
    const schemas = new Map<string, any>()

    // Get the actual spec object
    const actualSpec = 'spec' in spec ? spec.spec : spec

    // OpenAPI 3.x
    if ('components' in actualSpec && actualSpec.components) {
      const components = actualSpec.components as any
      if (components.schemas) {
        Object.entries(components.schemas).forEach(([name, schema]) => {
          schemas.set(name, schema)
        })
      }
    }

    // Swagger 2.0
    if ('definitions' in actualSpec && actualSpec.definitions) {
      Object.entries(actualSpec.definitions).forEach(([name, schema]) => {
        schemas.set(name, schema)
      })
    }

    return schemas
  }

  /**
   * Gets endpoints that were added
   * @param oldPaths - Paths from old spec
   * @param newPaths - Paths from new spec
   * @returns Array of added endpoints
   * @description Finds the new kids on the block
   */
  private getAddedEndpoints(
    oldPaths: Map<string, Record<string, any>>,
    newPaths: Map<string, Record<string, any>>
  ): Array<{ path: string; methods: string[] }> {
    const added: Array<{ path: string; methods: string[] }> = []

    newPaths.forEach((pathItem, path) => {
      const methods = this.getHttpMethods(pathItem)

      if (!oldPaths.has(path)) {
        // Entire path is new
        added.push({ path, methods })
      } else {
        // Check for new methods on existing path
        const oldMethods = this.getHttpMethods(oldPaths.get(path)!)
        const newMethods = methods.filter((m) => !oldMethods.includes(m))
        if (newMethods.length > 0) {
          added.push({ path, methods: newMethods })
        }
      }
    })

    return added
  }

  /**
   * Gets endpoints that were removed
   * @param oldPaths - Paths from old spec
   * @param newPaths - Paths from new spec
   * @returns Array of removed endpoints
   * @description Finds what got deleted. RIP endpoints. 🪦
   */
  private getRemovedEndpoints(
    oldPaths: Map<string, Record<string, any>>,
    newPaths: Map<string, Record<string, any>>
  ): Array<{ path: string; methods: string[] }> {
    const removed: Array<{ path: string; methods: string[] }> = []

    oldPaths.forEach((pathItem, path) => {
      const methods = this.getHttpMethods(pathItem)

      if (!newPaths.has(path)) {
        // Entire path was removed
        removed.push({ path, methods })
      } else {
        // Check for removed methods on existing path
        const newMethods = this.getHttpMethods(newPaths.get(path)!)
        const removedMethods = methods.filter((m) => !newMethods.includes(m))
        if (removedMethods.length > 0) {
          removed.push({ path, methods: removedMethods })
        }
      }
    })

    return removed
  }

  /**
   * Gets endpoints that were modified
   * @param oldPaths - Paths from old spec
   * @param newPaths - Paths from new spec
   * @returns Array of modified endpoints
   * @description Finds what changed. The edited versions.
   */
  private getModifiedEndpoints(
    oldPaths: Map<string, Record<string, any>>,
    newPaths: Map<string, Record<string, any>>
  ): Array<{ path: string; method: string; changes: string[] }> {
    const modified: Array<{ path: string; method: string; changes: string[] }> = []

    newPaths.forEach((newPathItem, path) => {
      if (!oldPaths.has(path)) return

      const oldPathItem = oldPaths.get(path)!
      const methods = this.getHttpMethods(newPathItem)

      methods.forEach((method) => {
        if (oldPathItem[method]) {
          const changes = this.detectEndpointChanges(oldPathItem[method], newPathItem[method])
          if (changes.length > 0) {
            modified.push({ path, method: method.toUpperCase(), changes })
          }
        }
      })
    })

    return modified
  }

  /**
   * Detects changes in an endpoint operation
   * @param oldOp - Old operation object
   * @param newOp - New operation object
   * @returns Array of change descriptions
   * @description Compares two versions of the same endpoint
   */
  private detectEndpointChanges(oldOp: any, newOp: any): string[] {
    const changes: string[] = []

    // Check for description changes
    if (oldOp.summary !== newOp.summary) {
      changes.push('summary changed')
    }

    // Check for parameter changes (simplified)
    const oldParams = oldOp.parameters?.length || 0
    const newParams = newOp.parameters?.length || 0
    if (oldParams !== newParams) {
      changes.push(`parameters changed (${oldParams} → ${newParams})`)
    }

    // Check for request body changes
    const hadRequestBody = !!oldOp.requestBody
    const hasRequestBody = !!newOp.requestBody
    if (hadRequestBody !== hasRequestBody) {
      changes.push(hasRequestBody ? 'request body added' : 'request body removed')
    }

    // Check for response changes
    const oldResponses = Object.keys(oldOp.responses || {})
    const newResponses = Object.keys(newOp.responses || {})
    if (oldResponses.length !== newResponses.length) {
      changes.push('responses changed')
    }

    return changes
  }

  /**
   * Gets schemas that were added
   * @param oldSchemas - Schemas from old spec
   * @param newSchemas - Schemas from new spec
   * @returns Array of added schemas
   * @description Finds new data models
   */
  private getAddedSchemas(
    oldSchemas: Map<string, any>,
    newSchemas: Map<string, any>
  ): Array<{ name: string; type: string }> {
    const added: Array<{ name: string; type: string }> = []

    newSchemas.forEach((schema, name) => {
      if (!oldSchemas.has(name)) {
        added.push({ name, type: schema.type || 'object' })
      }
    })

    return added
  }

  /**
   * Gets schemas that were removed
   * @param oldSchemas - Schemas from old spec
   * @param newSchemas - Schemas from new spec
   * @returns Array of removed schemas
   * @description Finds deleted data models
   */
  private getRemovedSchemas(
    oldSchemas: Map<string, any>,
    newSchemas: Map<string, any>
  ): Array<{ name: string }> {
    const removed: Array<{ name: string }> = []

    oldSchemas.forEach((_schema, name) => {
      if (!newSchemas.has(name)) {
        removed.push({ name })
      }
    })

    return removed
  }

  /**
   * Gets schemas that were modified
   * @param oldSchemas - Schemas from old spec
   * @param newSchemas - Schemas from new spec
   * @returns Array of modified schema names
   * @description Finds changed data models
   */
  private getModifiedSchemas(
    oldSchemas: Map<string, any>,
    newSchemas: Map<string, any>
  ): string[] {
    const modified: string[] = []

    newSchemas.forEach((newSchema, name) => {
      if (oldSchemas.has(name)) {
        const oldSchema = oldSchemas.get(name)
        // Simple check: if JSON representation differs, it's modified
        if (JSON.stringify(oldSchema) !== JSON.stringify(newSchema)) {
          modified.push(name)
        }
      }
    })

    return modified
  }

  /**
   * Detects potentially breaking changes
   * @param removedEndpoints - Endpoints that were removed
   * @param modifiedEndpoints - Endpoints that were modified
   * @param removedSchemas - Schemas that were removed
   * @param modifiedSchemas - Schemas that were modified
   * @returns Array of breaking change descriptions
   * @description Finds changes that might break existing clients. The danger zone. ⚠️
   */
  private detectBreakingChanges(
    removedEndpoints: Array<{ path: string; methods: string[] }>,
    modifiedEndpoints: Array<{ path: string; method: string; changes: string[] }>,
    removedSchemas: Array<{ name: string }>,
    modifiedSchemas: string[]
  ): string[] {
    const breaking: string[] = []

    // Removed endpoints are breaking
    removedEndpoints.forEach((endpoint) => {
      breaking.push(`Removed endpoint: ${endpoint.methods.join(',')} ${endpoint.path}`)
    })

    // Some endpoint modifications are breaking
    modifiedEndpoints.forEach((endpoint) => {
      if (endpoint.changes.includes('request body removed')) {
        breaking.push(`Breaking: ${endpoint.method} ${endpoint.path} - request body removed`)
      }
      if (endpoint.changes.includes('parameters changed')) {
        // Could be breaking if required params were added or removed
        breaking.push(
          `Potentially breaking: ${endpoint.method} ${endpoint.path} - parameters changed`
        )
      }
    })

    // Removed schemas are breaking if they're referenced
    removedSchemas.forEach((schema) => {
      breaking.push(`Removed schema: ${schema.name}`)
    })

    // Modified schemas might be breaking
    if (modifiedSchemas.length > 0) {
      breaking.push(`Modified schemas: ${modifiedSchemas.join(', ')} (review required)`)
    }

    return breaking
  }

  /**
   * Gets HTTP methods from a path item
   * @param pathItem - Path item object
   * @returns Array of HTTP methods
   * @description Extracts the verbs: GET, POST, PUT, etc.
   */
  private getHttpMethods(pathItem: Record<string, any>): string[] {
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
    return Object.keys(pathItem).filter((key) => httpMethods.includes(key.toLowerCase()))
  }
}

