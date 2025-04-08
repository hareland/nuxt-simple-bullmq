import { consola } from 'consola'
import { createBullMqRedisQueue, createMockQueue, wrapQueue } from '../../internal/queue'
import { useRuntimeConfig } from '#imports'

const queues = new Map<string, ReturnType<typeof wrapQueue>>()

export const useQueue = (queueName: string): ReturnType<typeof wrapQueue> => {
  const logger = consola.withTag(`queue:${queueName}`)
  if (queues.has(queueName)) {
    const candidate = queues.get(queueName)
    if (candidate) {
      logger.debug('Queue was cached.')
      return candidate
    }
  }

  const runtime = useRuntimeConfig()

  if (!runtime?.redis?.url) {
    logger.info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up (echo mode)')
    return wrapQueue(createMockQueue(queueName, { logger }) as never)
  }
  const queue = createBullMqRedisQueue(queueName, { logger, redisUrl: runtime.redis.url })
  queues.set(queueName, queue)
  return queue
}
