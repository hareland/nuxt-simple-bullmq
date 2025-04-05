import { Queue } from 'bullmq'

export const wrapQueue = (queue: Queue) => {
  return {
    async emit(name: string, payload: unknown) {
      await queue.add(name, payload)
    },
  }
}

export const mockQueue = (name = 'default') => {
  return wrapQueue(new Queue(name, {
    connection: {
      url: process.env.NUXT_REDIS_URL!,
    },
  }))
}
