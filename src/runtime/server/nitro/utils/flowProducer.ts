import { consola } from 'consola'
import { wrapFlowProducer, createBullMqFlowProducer } from '~/src/runtime/server/internal/flowProducer'
import { useRuntimeConfig } from '#imports'

const flowProducers = new Map<string, ReturnType<typeof wrapFlowProducer>>()

export const useFlowProducer = (queueName: string = 'default') => {
  const logger = consola.withTag(`flowproducer:${queueName}`)

  if (flowProducers.has(queueName)) {
    return flowProducers.get(queueName) as ReturnType<typeof wrapFlowProducer>
  }

  const runtime = useRuntimeConfig()

  if (!runtime?.redis?.url) {
    logger.info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up (echo mode)')
    return wrapFlowProducer(queueName, {} as never)
  }

  const producer = wrapFlowProducer(
    queueName,
    createBullMqFlowProducer({ redisUrl: runtime.redis.url! }),
  )
  flowProducers.set(queueName, producer)
  return producer
}
