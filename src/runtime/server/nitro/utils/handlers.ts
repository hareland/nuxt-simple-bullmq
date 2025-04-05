import type { infer as zInfer, ZodSchema } from 'zod'
import type { ParsedJobHandler, RawJobHandler } from '../types'

export function defineZodValidatedJobHandler<
  Schema extends ZodSchema,
>(handler: ParsedJobHandler<zInfer<Schema>>, schema: Schema): RawJobHandler {
  return async ({ job, logger }) => {
    const { data, success, error } = await schema.safeParseAsync(job.data)

    if (!success) {
      throw new Error(`Error parsing job: ${error.message}`)
    }

    return handler({ data, logger })
  }
}

// todo: definePublicJobListener
// todo: defineAuthenticatedJobListener extends definePublicJobListener
