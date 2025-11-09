/**
 * Security Configure Tool Schema
 */

import { z } from 'zod'

const baseParams = z.object({
  apiId: z.string().min(1),
  version: z.string().regex(/^v\d+/),
  llmReason: z.string().optional(),
})

export const securityConfigureSchema = z.discriminatedUnion('operation', [
  baseParams.extend({
    operation: z.literal('list_schemes'),
  }),
  baseParams.extend({
    operation: z.literal('add_scheme'),
    schemeName: z.string().min(1),
    scheme: z.record(z.any()),
  }),
  baseParams.extend({
    operation: z.literal('delete_scheme'),
    schemeName: z.string().min(1),
  }),
  baseParams.extend({
    operation: z.literal('set_global'),
    security: z.array(z.record(z.any())),
  }),
])

export type SecurityConfigureParams = z.infer<typeof securityConfigureSchema>

