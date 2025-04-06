import { Queue } from 'bullmq'

export const wrapMockQueue = (queue: Queue) => {
  return {
    async emit(name: string, payload: unknown) {
      await queue.add(name, payload)
    },
  }
}
