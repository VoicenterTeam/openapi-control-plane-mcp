/**
 * Parameters Configure Tool Schema
 *
 * @description Zod schemas for parameter management operations.
 * Managing parameters: the art of knowing what goes where, when, and why.
 */

import { z } from 'zod'

/**
 * Parameter location enum
 */
const parameterLocationSchema = z.enum(['query', 'header', 'path', 'cookie'])

/**
 * Base parameters for all operations
 */
const baseParams = z.object({
  apiId: z.string().min(1, 'API ID is required'),
  version: z.string().regex(/^v\d+/, 'Version must start with v (e.g., v1.0.0)'),
  llmReason: z.string().optional(),
})

/**
 * List parameters operation
 */
const listParametersSchema = baseParams.extend({
  operation: z.literal('list'),
  path: z.string().startsWith('/', 'Path must start with /'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
})

/**
 * Add parameter operation
 */
const addParameterSchema = baseParams.extend({
  operation: z.literal('add'),
  path: z.string().startsWith('/', 'Path must start with /'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  parameter: z.object({
    name: z.string().min(1, 'Parameter name is required'),
    in: parameterLocationSchema,
    description: z.string().optional(),
    required: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    schema: z.record(z.any()),
    example: z.any().optional(),
  }),
})

/**
 * Update parameter operation
 */
const updateParameterSchema = baseParams.extend({
  operation: z.literal('update'),
  path: z.string().startsWith('/', 'Path must start with /'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  parameterName: z.string().min(1, 'Parameter name is required'),
  parameterIn: parameterLocationSchema,
  updates: z.record(z.any()).optional(),
})

/**
 * Delete parameter operation
 */
const deleteParameterSchema = baseParams.extend({
  operation: z.literal('delete'),
  path: z.string().startsWith('/', 'Path must start with /'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  parameterName: z.string().min(1, 'Parameter name is required'),
  parameterIn: parameterLocationSchema,
})

/**
 * Complete parameters configure schema (discriminated union)
 */
export const parametersConfigureSchema = z.discriminatedUnion('operation', [
  listParametersSchema,
  addParameterSchema,
  updateParameterSchema,
  deleteParameterSchema,
])

/**
 * TypeScript type for parameters configure parameters
 */
export type ParametersConfigureParams = z.infer<typeof parametersConfigureSchema>

