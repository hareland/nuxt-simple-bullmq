import { Queue } from 'bullmq'
import { consola } from 'consola'
import { useRuntimeConfig } from '#imports'

export const wrapQueue = (queue: Queue) => {
  return {
    async emit(name: string, payload: unknown) {
      await queue.add(name, payload)
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
    }
  }
  console.log(runtime.redis.url)
  const queue = new Queue(name, {
    connection: {
      url: runtime.redis.url!,
    },
  })

  const wrappedQueue = wrapQueue(queue)
  queues.set(name, wrappedQueue)

  return wrappedQueue
}
