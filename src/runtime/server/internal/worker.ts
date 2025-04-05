import type { ConsolaInstance } from 'consola'
import { consola } from 'consola'
import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import type { JobHandler, WorkerDefinition } from '~/src/runtime/server/nitro/types'

const resolveQueueHandler = (queueName: string, definition: WorkerDefinition, jobName: string): JobHandler => {
  const handlerDefinition = definition[jobName]

  if (!handlerDefinition) {
    throw new Error(`Unknown handler: ${queueName}.${jobName}`)
  }

  if (typeof handlerDefinition === 'function') {
    return handlerDefinition
  }

  if (
    typeof handlerDefinition === 'object'
    && typeof handlerDefinition.handler === 'function'
  ) {
    return handlerDefinition.handler
  }

  throw new Error(`Invalid handler: ${queueName}.${jobName}`)
}

const jobRouter = (queueName: string, definition: WorkerDefinition, logger: ConsolaInstance) => {
  return async (job: Job) => {
    logger.info(`Processing ${job.name}#${job.id}`)
    const handler = resolveQueueHandler(queueName, definition, job.name)
    await handler({ job, logger })
    logger.info(`Completed ${job.name}#${job.id}`)
  }
}
export const defineBullMqRedisWorker = (
  queueName: string,
  definition: WorkerDefinition,
  redisUrl?: string,
): undefined | Worker => {
  const startedAt = Date.now()
  const logger = consola.withTag(`plugin:worker:${queueName}`)
  if (import.meta.prerender) {
    logger.info('prerender=skip')
    return undefined
  }

  logger.info(`Starting worker`)

  if (!redisUrl) {
    consola.withTag('bullmq:config').info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up')
    return undefined
  }

  const worker = new Worker(
    queueName,
    jobRouter(queueName, definition, logger),
    {
      connection: {
        url: redisUrl,
      },
    },
  )

  worker.on('ready', () => {
    logger.info(`Worker started in ${(Date.now() - startedAt)}ms`)
  })

  worker.on('error', (err) => {
    logger.error(err)
  })

  worker.on('closing', () => {
    logger.info('Shutting down')
  })

  worker.on('closed', () => {
    logger.info('Worker closed.')
  })

  return worker
}
