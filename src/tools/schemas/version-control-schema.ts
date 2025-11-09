/**
 * Version Control Tool Schema
 *
 * @description Zod schemas for version management operations.
 * Because managing API versions shouldn't feel like time travel without a map.
 */

import { z } from 'zod'

/**
 * Base parameters for all version operations
 */
const baseParams = z.object({
  apiId: z.string().min(1, 'API ID is required'),
  llmReason: z.string().optional(),
})

/**
 * List versions operation
 */
const listVersionsSchema = baseParams.extend({
  operation: z.literal('list'),
})

/**
 * Create version operation
 */
const createVersionSchema = baseParams.extend({
  operation: z.literal('create'),
  version: z.string().regex(/^v\d+/, 'Version must start with v (e.g., v1.0.0)'),
  sourceVersion: z.string().regex(/^v\d+/, 'Source version must start with v').optional(),
  description: z.string().optional(),
})

/**
 * Get version details operation
 */
const getVersionSchema = baseParams.extend({
  operation: z.literal('get'),
  version: z.string().regex(/^v\d+/, 'Version must start with v'),
})

/**
 * Compare versions operation
 */
const compareVersionsSchema = baseParams.extend({
  operation: z.literal('compare'),
  fromVersion: z.string().regex(/^v\d+/, 'From version must start with v'),
  toVersion: z.string().regex(/^v\d+/, 'To version must start with v'),
})

/**
 * Set current version operation
 */
const setCurrentSchema = baseParams.extend({
  operation: z.literal('set_current'),
  version: z.string().regex(/^v\d+/, 'Version must start with v'),
})

/**
 * Delete version operation
 */
const deleteVersionSchema = baseParams.extend({
  operation: z.literal('delete'),
  version: z.string().regex(/^v\d+/, 'Version must start with v'),
})

/**
 * Complete version control schema (discriminated union)
 */
export const versionControlSchema = z.discriminatedUnion('operation', [
  listVersionsSchema,
  createVersionSchema,
  getVersionSchema,
  compareVersionsSchema,
  setCurrentSchema,
  deleteVersionSchema,
])

/**
 * TypeScript type for version control parameters
 */
export type VersionControlParams = z.infer<typeof versionControlSchema>

