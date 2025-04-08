import type { ConsolaInstance } from 'consola'
import { consola } from 'consola'
import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import defu from 'defu'
import type { JobHandler, WorkerDefinition } from '~/src/runtime/server/nitro/types'

const resolveQueueHandler = (queueName: string, definition: WorkerDefinition, jobName: string): JobHandler => {
  let handlerDefinition = definition[jobName]
  const catchAllDefinition = definition.catchAll || undefined

  if (!handlerDefinition && catchAllDefinition) {
    handlerDefinition = catchAllDefinition
  }
  else if (!handlerDefinition) {
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
  return async (job: Job, token?: string) => {
    const jobLogger = logger.withTag(`${job.name}`)
    const handler = resolveQueueHandler(queueName, definition, job.name)
    return handler({ queueName, job: job, logger: jobLogger, lockId: token })
  }
}
export const defineBullMqRedisWorker = (
  queueName: string,
  definition: WorkerDefinition,
  redisUrl?: string,
  _options: { logger?: ConsolaInstance, concurrency?: number } = {},
): undefined | Worker => {
  const startedAt = Date.now()
  const logger = _options.logger || consola.withTag(`bullmq:worker:${queueName}`)
  if (import.meta.prerender) {
    logger.info('prerender=skip')
    return undefined
  }

  logger.info(`Starting worker`)

  if (!redisUrl) {
    logger.withTag('config').info('Missing NUXT_REDIS_URL/runtimeConfig.redis.url: Not setting up')
    return undefined
  }

  const options = defu(_options, {
    logger,
    concurrency: 1,
  })

  const worker = new Worker(
    queueName,
    jobRouter(queueName, definition, logger),
    {
      connection: {
        url: redisUrl,
      },
      concurrency: options.concurrency,
      // todo: set autorun: false and handle it in the consumer of this method
      //  (add a start etc wrapper like in the queue)
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

  worker.on('stalled', (jobId) => {
    logger.info(`Stalled job #${jobId}`)
  })

  worker.on('active', (job) => {
    logger.withTag(job.name).info(`Processing #${job.id || 'n/a'}`)
  })

  worker.on('completed', (job) => {
    logger.withTag(job.name).info(`Completed #${job.id || 'n/a'}`)
  })

  worker.on('progress', (job, p) => {
    logger.withTag(job.name).info(`Progress #${job.id}: ${p}`)
  })

  return worker
}
