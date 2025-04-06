import { describe, it, expect } from 'vitest'
import { consola } from 'consola'
import { createBullMqRedisQueue } from '../src/runtime/server/internal/queue'

describe('integration test', async () => {
  const redisUrl = process.env.NUXT_REDIS_URL || 'redis://localhost:6379'

  it('handle a job for bullmq on the server', async () => {
    const logger = consola.withTag('test:job')
    const queueName = '_test-integration'
    const eventName = 'test-integration'
    const eventBody = { message: 'test-itg' }
    const queue = createBullMqRedisQueue(queueName, { logger, redisUrl })

    await queue.emit(eventName, eventBody)

    // todo: create a task that writes to .test file using unjs/rc9 with the body result., when it is writte - test success
    // todo: this can be done inside the fixture as we need to define the worker there, but we can emit the job from here.

    expect(true).eql(true)
  })
})
