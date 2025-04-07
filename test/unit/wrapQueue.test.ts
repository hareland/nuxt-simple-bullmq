import { describe, it, expect, beforeEach } from 'vitest'
import { consola } from 'consola'
import type { Queue } from 'bullmq'
import { z } from 'zod'
import { createMockQueue, wrapQueue } from '../../src/runtime/server/internal/queue'

describe('wrapQueue', () => {
  const logger = consola.withTag('test')
  let queue = createMockQueue('test', { logger })
  const schema = z.object({ value: z.string() })
  let mock: ReturnType<typeof wrapQueue>
  beforeEach(() => {
    queue = createMockQueue('test', { logger })
    mock = wrapQueue(queue as never as Queue)
  })

  it('should validate schema', async () => {
    // We expect this to type wrongly as we pass in the wrong type.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await expect(() => mock.emit('TestJob', { value: false }, { schema }))
      .rejects.toThrow('\'value\': Expected string, received boolean')
  })

  it('should push the job correctly', async () => {
    const workPromise = new Promise((resolve, reject) => {
      let attempts = 0
      const interval = setInterval(() => {
        if (queue.jobs.length > 0) resolve(queue.jobs)
        attempts++
        clearInterval(interval)
      }, 10)

      if (attempts > 15) {
        clearInterval(interval)
        reject(new Error('Too many attempts.'))
      }
    })

    await mock.emit('TestJob', { value: 'hi mom' }, { schema })
    expect(await workPromise).containSubset([
      { queueName: 'test', name: 'TestJob', payload: { value: 'hi mom' } },
    ])
  })
})
