/**
 * Endpoint Management Tool Schema
 *
 * @description Zod schemas for validating endpoint management parameters.
 * Because type safety is not optional, unlike pineapple on pizza.
 */

import { z } from 'zod'

/**
 * HTTP Methods enum for validation
 */
const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
  'TRACE',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
])

/**
 * OpenAPI Operation object schema (simplified)
 *
 * @description Validates operation objects. We allow any additional properties
 * because OpenAPI operations are quite flexible and can have x- extensions.
 */
const operationSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  operationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parameters: z.array(z.any()).optional(),
  requestBody: z.any().optional(),
  responses: z.record(z.any()).optional(),
  deprecated: z.boolean().optional(),
  security: z.array(z.any()).optional(),
  servers: z.array(z.any()).optional(),
}).passthrough() // Allow x- extensions and other properties

/**
 * Base parameters shared by all operations
 */
const baseParams = z.object({
  apiId: z.string().min(1, 'API ID is required'),
  version: z.string().regex(/^v\d+/, 'Version must start with v (e.g., v1.0.0)'),
  llmReason: z.string().optional(),
})

/**
 * List operation parameters
 */
const listParamsSchema = baseParams.extend({
  operation: z.literal('list'),
})

/**
 * Add operation parameters
 */
const addParamsSchema = baseParams.extend({
  operation: z.literal('add'),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  method: httpMethodSchema,
  operationObject: operationSchema,
})

/**
 * Update operation parameters
 */
const updateParamsSchema = baseParams.extend({
  operation: z.literal('update'),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  method: httpMethodSchema,
  updates: z.record(z.any()),
})

/**
 * Delete operation parameters
 */
const deleteParamsSchema = baseParams.extend({
  operation: z.literal('delete'),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  method: httpMethodSchema,
})

/**
 * Complete endpoint management schema (discriminated union)
 */
export const endpointManageSchema = z.discriminatedUnion('operation', [
  listParamsSchema,
  addParamsSchema,
  updateParamsSchema,
  deleteParamsSchema,
])

/**
 * TypeScript type for endpoint management parameters
 */
export type EndpointManageParams = z.infer<typeof endpointManageSchema>

