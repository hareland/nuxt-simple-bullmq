import type { infer as zInfer, ZodSchema } from 'zod'
import type { ParsedJobHandler, RawJobHandler } from '../types'

export function defineZodValidatedJobHandler<
  Schema extends ZodSchema,
>(handler: ParsedJobHandler<zInfer<Schema>>, schema: Schema): RawJobHandler {
  return async ({ job, logger }) => {
    const { data, success, error } = await schema.safeParseAsync(job.data)

    if (error) {
      throw new Error(`Error parsing job: ${error.message}`)
    }

    if (!success) {
      throw new Error(`Job failed due to schema mismatch  ${job.id}`)
    }

    if (!data) {
      logger.info('No valid payload.')
      throw new Error('Invalid payload')
    }
    else if (typeof data === 'object' && Object.keys(data).length === 0) {
      throw new Error('Invalid payload')
    }

    return handler({ data, logger })
  }
}

// todo: definePublicJobListener
// todo: defineAuthenticatedJobListener extends definePublicJobListener
