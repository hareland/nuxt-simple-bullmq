import type { infer as zInfer, ZodSchema } from 'zod'
import type { EventHandler, ParsedEventHandler, RawEventHandler } from '../types'

export function defineEventHandler(handler: EventHandler): RawEventHandler {
  return (props) => {
    return handler(props)
  }
}

export function defineValidatedEventHandler<
  Schema extends ZodSchema,
>(schema: Schema, handler: ParsedEventHandler<zInfer<Schema>>): RawEventHandler {
  return async ({ event, logger }) => {
    try {
      const { data, success, error } = await schema.safeParseAsync(event.data)

      if (error) {
        const msg = `Error parsing event: ${error.message}`
        logger.info(msg)
        throw new Error(msg)
      }

      if (!success) {
        const msg = `Event failed due to schema mismatch  ${event.id}`
        logger.info(msg)
        throw new Error(msg)
      }

      const ipMessage = 'Invalid payload'
      if (!data) {
        logger.info(ipMessage)
        throw new Error(ipMessage)
      }
      else if (typeof data === 'object' && Object.keys(data).length === 0) {
        throw new Error(ipMessage)
      }

      return handler({ data, logger, event })
    }
    catch (err: unknown) {
      logger.error(err)
      throw err
    }
  }
}

// todo: definePublicEventListener
// todo: defineAuthenticatedEventListener extends definePublicEventListener
