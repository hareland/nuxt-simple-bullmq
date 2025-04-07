import { consola } from 'consola'
import type { ZodSchema, infer as zInfer } from 'zod'
import defu from 'defu'
import type { wrapQueue } from '../../internal/queue'
import { createBullMqRedisQueue } from '../../internal/queue'
import { ValidationError } from '../../nitro/errors'
import { useRuntimeConfig, createError } from '#imports'
import type { EmitOptions } from '~/src/runtime/server/nitro/types'

export { wrapQueue } from '../../internal/queue'

const queues = new Map<string, ReturnType<typeof wrapQueue>>()

export const useQueue = (name: string): ReturnType<typeof wrapQueue> => {
  const logger = consola.withTag(`queue:${name}`)
  if (queues.has(name)) {
    const candidate = queues.get(name)
    if (candidate) {
      logger.debug('Queue was cached.')
      return candidate
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

export const emitEvent = (eventName: string, payload: unknown, options: Partial<EmitOptions & { queueName: string }> = { queueName: 'default' }) => {
  const { queueName, ...emitOptions } = defu(options, {
    queueName: 'default',
  })

  const queue = useQueue(queueName)
  return queue.emit(eventName, payload, emitOptions)
}

export const emitValidatedEvent = async <T extends ZodSchema>(
  eventName: string,
  schema: T,
  payload: zInfer<T>,
  options: Partial<EmitOptions & { queueName: string }> = { queueName: 'default' },
) => {
  const { data, error } = await schema.safeParseAsync(payload)

  const { queueName, ...emitOptions } = defu(options, {
    queueName: 'default',
  })

  if (error) {
    const err = new ValidationError(error.issues ?? [])
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: err.message,
      cause: err?.cause || error,
      stack: err?.stack,
    })
  }

  const queue = useQueue(queueName)
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  return queue.emit(eventName, data, emitOptions)
}
