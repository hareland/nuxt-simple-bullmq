import type { NitroAppPlugin } from 'nitropack'
import { consola } from 'consola'
import type { WorkerDefinition } from '../types'
import { defineBullMqRedisWorker } from '../../internal/worker'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export const defineWorker = (
  queueName: string,
  definition: WorkerDefinition,
): NitroAppPlugin => {
  return defineNitroPlugin((nitroApp) => {
    const logger = consola.withTag(`bullmq:plugin:queue:${queueName}`)
    const redisUrl = useRuntimeConfig()?.redis?.url || process.env.NUXT_REDIS_URL!
    const worker = defineBullMqRedisWorker(queueName, definition, redisUrl)

    nitroApp.hooks.hookOnce('close', async () => {
      await worker?.close()
      logger.info('Shutting down completed.')
    })
  })
}
