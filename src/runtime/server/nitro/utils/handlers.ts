import type { infer as zInfer, ZodSchema } from 'zod'
import type { ParsedJobHandler, RawJobHandler } from '../types'

export function defineZodValidatedJobHandler<
  Schema extends ZodSchema,
>(handler: ParsedJobHandler<zInfer<Schema>>, schema: Schema): RawJobHandler {
  return async ({ job, logger }) => {
    const parsed = await schema.safeParseAsync(job.data)

    if (!parsed.success) {
      throw new Error(`Error parsing job: ${parsed.error.message}`)
    }

    return handler({ data: parsed, logger })
  }
}

// todo: definePublicJobListener
// todo: defineAuthenticatedJobListener extends definePublicJobListener
