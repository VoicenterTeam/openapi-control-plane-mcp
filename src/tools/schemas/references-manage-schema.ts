/**
 * References Manage Tool Schema
 */

import { z } from 'zod'

const baseParams = z.object({
  apiId: z.string().min(1),
  version: z.string().regex(/^v\d+/),
  llmReason: z.string().optional(),
})

export const referencesManageSchema = z.discriminatedUnion('operation', [
  baseParams.extend({
    operation: z.literal('find'),
    componentName: z.string().min(1),
    componentType: z.enum(['schemas', 'responses', 'parameters', 'examples', 'requestBodies', 'headers']),
  }),
  baseParams.extend({
    operation: z.literal('validate'),
  }),
  baseParams.extend({
    operation: z.literal('update'),
    oldRef: z.string().min(1),
    newRef: z.string().min(1),
  }),
])

export type ReferencesManageParams = z.infer<typeof referencesManageSchema>

