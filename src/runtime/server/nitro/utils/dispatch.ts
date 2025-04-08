import type { ZodSchema, infer as zInfer } from 'zod'
import defu from 'defu'
import { ValidationError } from '../../nitro/errors'
import { useQueue } from './queue'
import { createError } from '#imports'
import type { EmitOptions } from '~/src/runtime/server/nitro/types'

export { wrapQueue, createMockQueue } from '../../internal/queue'

export const dispatchJob = (eventName: string, payload: unknown, options: Partial<EmitOptions & { queueName: string }> = { queueName: 'default' }) => {
  const { queueName, ...emitOptions } = defu(options, {
    queueName: 'default',
  })

  const queue = useQueue(queueName)
  return queue.emit(eventName, payload, emitOptions)
}

export const dispatchValidatedJob = async <T extends ZodSchema>(
  eventName: string,
  schema: T,
  payload: zInfer<T>,
  options: Partial<EmitOptions & { queueName: string }> = { queueName: 'default' },
) => {
  const { data, error } = await schema.safeParseAsync(payload)

  const { queueName, ...emitOptions } = defu(options, {
    queueName: 'default',
  })

  if (error) {
    const err = new ValidationError(error.issues ?? [])
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: err.message,
      cause: err?.cause || error,
      stack: err?.stack,
    })
  }

  const queue = useQueue(queueName)
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  return queue.emit(eventName, data, emitOptions)
}
