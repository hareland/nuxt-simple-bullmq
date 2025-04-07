import type { infer as zInfer, ZodSchema } from 'zod'
import type { JobHandler, ParsedJobHandler, RawJobHandler } from '../types'

export function defineJobHandler(handler: JobHandler): RawJobHandler {
  return (props) => {
    return handler(props)
  }
}

export function defineValidatedJobHandler<
  Schema extends ZodSchema,
>(schema: Schema, handler: ParsedJobHandler<zInfer<Schema>>): RawJobHandler {
  return async ({ queueName, job, logger }) => {
    try {
      const { data, success, error } = await schema.safeParseAsync(job.data)

      if (error) {
        const msg = `Error parsing job: ${error.message}`
        logger.error(msg)
        throw new Error(msg)
      }

      if (!success) {
        const msg = `Job failed due to schema mismatch  ${job.id}`
        logger.info(msg)
        throw new Error(msg)
      }

      const ipMessage = 'Invalid payload'
      if (!data) {
        logger.error(ipMessage)
        throw new Error(ipMessage)
      }
      else if (typeof data === 'object' && Object.keys(data).length === 0) {
        throw new Error(ipMessage)
      }

      return handler({ queueName, data, logger, job })
    }
    catch (err: unknown) {
      logger.error(err)
      throw err
    }
  }
}

// todo: definePublicEventListener
// todo: defineAuthenticatedEventListener extends definePublicEventListener
