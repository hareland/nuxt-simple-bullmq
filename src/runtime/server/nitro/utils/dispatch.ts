import { consola } from 'consola'
import type { ZodSchema } from 'zod'
import type { wrapQueue } from '../../internal/queue'
import { createBullMqRedisQueue } from '../../internal/queue'
import { useRuntimeConfig, createError } from '#imports'

export { wrapQueue } from '../../internal/queue'

const queues = new Map<string, ReturnType<typeof wrapQueue>>()

export const useQueue = (name: string): ReturnType<typeof wrapQueue> => {
  const logger = consola.withTag(`queue:${name}`)
  if (queues.has(name) && queues.get(name) !== undefined) {
    const cand = queues.get(name)
    if (cand) {
      logger.debug('Queue was cached.')
      return cand
    }
  }

  const runtime = useRuntimeConfig()

  if (!runtime?.redis?.url) {
    logger.info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up (echo mode)')
    return {
      async emit(name: string, payload: unknown): Promise<void> {
        logger.info(name, payload)
      },
      async close() {

      },
    }
  }
  const queue = createBullMqRedisQueue(name, { logger, redisUrl: runtime.redis.url })
  queues.set(name, queue)
  return queue
}

export const dispatchValidatedEvent = async (eventName: string, schema: ZodSchema, payload: unknown, queueName = 'default') => {
  const { data, error } = await schema.safeParseAsync(payload)

  if (error) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: error.message || 'Unexpected Entity - Unknown',
      cause: error?.cause || error,
      stack: error?.stack,
    })
  }
  const queue = useQueue(queueName)
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  return queue.emit(eventName, data)
}
