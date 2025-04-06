import type { DebounceOptions } from 'bullmq'
import { Queue } from 'bullmq'
import type { ConsolaInstance } from 'consola'
import { consola } from 'consola'

export const wrapQueue = (queue: Queue) => {
  return {
    async emit(name: string, payload: unknown, { delay, deduplicationId, ttl }: {
      delay?: number
      deduplicationId?: string
      ttl?: number
    } = {}) {
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

export const createBullMqRedisQueue = (name: string, { logger: providedLogger, redisUrl }: {
  logger?: ConsolaInstance
  redisUrl?: string
} = {}): ReturnType<typeof wrapQueue> => {
  const logger = providedLogger || consola.withTag('bullmq:dispatch')
  if (!redisUrl) {
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
      url: redisUrl,
    },
  })

  return wrapQueue(queue)
}
