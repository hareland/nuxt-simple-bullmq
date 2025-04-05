import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { Queue } from 'bullmq'
import { defineBullMqRedisWorker } from '../src/runtime/server/internal/worker'

describe('does its job', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    server: true,
  })

  const redisUrl = process.env.NUXT_REDIS_URL || 'redis://localhost:6379'

  it('handle a job', async () => {
    const queueName = '_test'
    const eventName = 'test'
    const eventBody = { message: 'test' }
    const queue = new Queue(queueName, {
      connection: {
        url: redisUrl,
      },
    })

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
    await queue.add(eventName, eventBody)

    expect(await promise).containSubset({
      name: eventName,
      context: eventBody,
    })
  })
})
