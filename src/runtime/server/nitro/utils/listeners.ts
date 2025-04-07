import type { ZodSchema } from 'zod'
import type { EventListener } from '../types'
import { dispatchJob, dispatchValidatedJob } from './dispatch'

// todo: for future usage when defining file based listeners for auto registration and "triggering"
// const listener = defineJobHandler('listenToMe', {
//   queueName: 'default',
//   schema: z.object({ userId: z.string() }),
//   async handle({ data }) {},
// })
//
// // here handle should also be typed correctly
// await listener.handle({ data: { userId: 'test' } })

export const defineJobListener = <Schema extends ZodSchema>(
  eventName: string,
  options: Omit<EventListener<Schema>, 'eventName' | 'trigger'>,
): EventListener<Schema> => {
  return {
    eventName,
    ...options,
    async trigger(payload) {
      if (!options.schema) {
        return dispatchJob(eventName, payload, options)
      }
      return dispatchValidatedJob(eventName, options.schema, payload, options)
    },
  }
}
