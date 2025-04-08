import type { BackoffOptions, DebounceOptions } from 'bullmq'
import { Queue } from 'bullmq'
import type { ConsolaInstance } from 'consola'
import { consola } from 'consola'
import type { ZodSchema } from 'zod'
import type { WrappedQueue, EmitOptions } from '../nitro/types'
import { ValidationError } from '../nitro/errors'

type MockQueueItem = { queueName: string, name: string, payload: never, options: never }

export const createMockQueue = (queueName: string = 'default', { logger }: { logger?: ConsolaInstance } = {}) => {
  logger ||= consola.withTag(`mockQueue:${queueName}`)
  return {
    events: <MockQueueItem[]>[],
    add(name: string, payload: never, options: never) {
      logger.info(`${queueName}.${name}`, { payload, options })
      this.events.push({ queueName, name, payload, options })
    },
    close() {
      logger.info(`${queueName}.close`)
      this.events = []
    },
  }
}

export const wrapQueue = (queue: Queue): WrappedQueue => {
  return {
    emit: async function (name: string, payload: unknown, third?: EmitOptions | ZodSchema) {
      let schema: ZodSchema | undefined
      let options: EmitOptions = {}

      if (third && 'safeParse' in third) {
        schema = third
      }
      else if (third) {
        options = third
        schema = third.schema
      }

      if (schema) {
        const parsed = schema.safeParse(payload)
        if (!parsed.success) {
          throw new ValidationError(parsed.error?.issues || [])
        }
      }

      const {
        delay,
        deduplicationId,
        ttl,
        attempts: attemptOptions,
        backoff: backoffOptions,
      } = options

      let deduplication: DebounceOptions | undefined
      if (!ttl && deduplicationId) {
        deduplication = { id: deduplicationId }
      }
      else if (ttl && !deduplicationId) {
        deduplication = { id: name, ttl }
      }
      else if (ttl && deduplicationId) {
        deduplication = { id: deduplicationId, ttl }
      }

      // by default, we do not allow retries unless specified
      let attempts = 1
      if (attemptOptions) {
        attempts = attemptOptions
      }

      // our default backoff strategy is always fixed and 5s
      let backoff: BackoffOptions = { type: 'fixed', delay: 5000 }
      if (typeof backoffOptions === 'number') {
        backoff = {
          type: 'fixed',
          delay: backoffOptions,
        }
      }
      else if (backoffOptions) {
        backoff = backoffOptions
      }

      await queue.add(name, payload, {
        delay,
        deduplication,
        attempts,
        backoff,
      })
    },

    async close() {
      await queue.close()
    },
  }
}

export const createBullMqRedisQueue = (name: string, { logger: providedLogger, redisUrl }: {
  logger?: ConsolaInstance
  redisUrl?: string
} = {}): ReturnType<typeof wrapQueue> => {
  const logger = providedLogger || consola.withTag('bullmq:dispatch')
  if (!redisUrl) {
    logger.info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up (echo mode)')
    return wrapQueue(createMockQueue(name, { logger }) as never as Queue)
  }
  const queue = new Queue(name, {
    connection: {
      url: redisUrl,
      // this option enables us to fail quickly instead of keeping a HTTP request waiting when redis is unavailable
      // todo: investigate if this is always desired in nuxt, or should be configurable
      enableOfflineQueue: false,
    },
  })

  return wrapQueue(queue)
}
