import type { infer as zInfer, ZodSchema } from 'zod'
import type { ParsedJobHandler, RawJobHandler } from '../types'

export function defineZodValidatedJobHandler<
  Schema extends ZodSchema,
>(handler: ParsedJobHandler<zInfer<Schema>>, schema: Schema): RawJobHandler {
  return async ({ job, logger }) => {
    try {
      const { data, success, error } = await schema.safeParseAsync(job.data)

      if (error) {
        const msg = `Error parsing job: ${error.message}`
        logger.debug(msg)
        throw new Error(msg)
      }

      if (!success) {
        const msg = `Job failed due to schema mismatch  ${job.id}`
        logger.debug(msg)
        throw new Error(msg)
      }

      const ipMessage = 'Invalid payload'
      if (!data) {
        logger.debug(ipMessage)
        throw new Error(ipMessage)
      }
      else if (typeof data === 'object' && Object.keys(data).length === 0) {
        throw new Error(ipMessage)
      }

      return handler({ data, logger, job })
    }
    catch (err: unknown) {
      logger.error(err)
      throw err
    }
  }
}

// todo: definePublicJobListener
// todo: defineAuthenticatedJobListener extends definePublicJobListener
