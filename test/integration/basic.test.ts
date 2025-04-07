import { describe, it, expect } from 'vitest'
import { consola } from 'consola'
import { defineBullMqRedisWorker } from '../../src/runtime/server/internal/worker'
import { createBullMqRedisQueue } from '../../src/runtime/server/internal/queue'

describe('basic integration test', async () => {
  const redisUrl = process.env.NUXT_REDIS_URL || 'redis://localhost:6379'

  it('handle a job for bullmq', async () => {
    const logger = consola.withTag('test:job')
    const queueName = '_test'
    const eventName = 'test'
    const eventBody = { message: 'test' }
    const queue = createBullMqRedisQueue(queueName, { logger, redisUrl })

    const promise = new Promise((resolve, reject) => {
      try {
        return defineBullMqRedisWorker(queueName, {
          async test({ job }) {
            resolve({
              name: job.name,
              queueName: job.queueName,
              context: job.data,
            })
          },
        }, redisUrl)
      }
      catch (e) {
        reject(e)
      }
    })
    await queue.emit(eventName, eventBody)

    const expectedJobResult = {
      name: eventName,
      queueName,
      context: eventBody,
    }
    expect(await promise).containSubset(expectedJobResult)
  })
})
