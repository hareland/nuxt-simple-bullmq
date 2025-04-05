import { Queue } from 'bullmq'
import { consola } from 'consola'
import type { DebounceOptions } from 'bullmq/dist/esm/interfaces/debounce-options'
import type { ZodSchema } from 'zod'
import { useRuntimeConfig, createError } from '#imports'

export const wrapQueue = (queue: Queue) => {
  return {
    async emit(name: string, payload: unknown, { delay, deduplicationId, ttl }: { delay?: number, deduplicationId?: string, ttl?: number } = {}) {
      let deduplication: DebounceOptions | undefined = undefined
      if (!ttl && deduplicationId) {
        deduplication = { id: deduplicationId }
      }
      else if (ttl && !deduplicationId) {
        deduplication = { id: name, ttl }
      }
      else if (ttl && deduplicationId) {
        deduplication = { id: deduplicationId, ttl }
      }
      await queue.add(name, payload, {
        delay,
        deduplication,
      })
    },
    async close() {
      await queue.close()
    },
  }
}
const queues = new Map<string, ReturnType<typeof wrapQueue>>()

export const useQueue = (name: string): ReturnType<typeof wrapQueue> => {
  const logger = consola.withTag('bullmq:dispatch')
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
  const queue = new Queue(name, {
    connection: {
      url: runtime.redis.url!,
    },
  })

  const wrappedQueue = wrapQueue(queue)
  queues.set(name, wrappedQueue)

  return wrappedQueue
}

export const dispatchValidatedEvent = async (eventName: string, schema: ZodSchema, payload: unknown, queueName = 'default') => {
  const { data, error } = await schema.safeParseAsync(payload)

  if (error) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: error.message || 'Unexpected Entity - Unknown',
      cause: error.cause,
    })
  }
  const queue = useQueue(queueName)
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  return queue.emit(eventName, data)
}
