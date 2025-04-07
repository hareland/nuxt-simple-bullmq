import type { NitroAppPlugin } from 'nitropack'
import { consola } from 'consola'
import type { WorkerDefinition } from '../types'
import { defineBullMqRedisWorker } from '../../internal/worker'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export const defineWorker = (
  queueName: string,
  definition: WorkerDefinition,
  { concurrency }: { concurrency?: number } = {},
): NitroAppPlugin => {
  return defineNitroPlugin((nitroApp) => {
    const logger = consola.withTag(`worker:${queueName}`)

    // todo: bind listeners from registered listeners (in filesystem) using nuxt module init.

    const redisUrl = useRuntimeConfig()?.redis?.url || process.env.NUXT_REDIS_URL!
    const worker = defineBullMqRedisWorker(
      queueName,
      definition,
      redisUrl,
      { logger, concurrency },
    )

    nitroApp.hooks.hookOnce('close', async () => {
      await worker?.close()
      logger.info('Shutting down completed.')
    })
  })
}
