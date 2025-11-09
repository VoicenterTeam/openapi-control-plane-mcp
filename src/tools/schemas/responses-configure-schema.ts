/**
 * Responses Configure Tool Schema
 *
 * @description Zod schemas for response management operations.
 */

import { z } from 'zod'

const baseParams = z.object({
  apiId: z.string().min(1),
  version: z.string().regex(/^v\d+/),
  llmReason: z.string().optional(),
})

const listResponsesSchema = baseParams.extend({
  operation: z.literal('list'),
  path: z.string().startsWith('/'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
})

const addResponseSchema = baseParams.extend({
  operation: z.literal('add'),
  path: z.string().startsWith('/'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  statusCode: z.string().regex(/^\d{3}$/),
  response: z.object({
    description: z.string(),
    content: z.record(z.any()).optional(),
    headers: z.record(z.any()).optional(),
  }),
})

const updateResponseSchema = baseParams.extend({
  operation: z.literal('update'),
  path: z.string().startsWith('/'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  statusCode: z.string().regex(/^\d{3}$/),
  updates: z.record(z.any()),
})

const deleteResponseSchema = baseParams.extend({
  operation: z.literal('delete'),
  path: z.string().startsWith('/'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  statusCode: z.string().regex(/^\d{3}$/),
})

export const responsesConfigureSchema = z.discriminatedUnion('operation', [
  listResponsesSchema,
  addResponseSchema,
  updateResponseSchema,
  deleteResponseSchema,
])

export type ResponsesConfigureParams = z.infer<typeof responsesConfigureSchema>

