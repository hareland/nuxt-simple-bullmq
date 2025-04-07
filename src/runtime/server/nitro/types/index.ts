import type { Worker, Job } from 'bullmq'
import type { ConsolaInstance } from 'consola'
import type { ZodSchema, infer as zInfer } from 'zod'

export type JobHandlerPayload = { job: Job, logger: ConsolaInstance }
export type JobHandler = (props: JobHandlerPayload) => Promise<never | void>
export type RawJobHandler = (props: JobHandlerPayload) => Promise<void>
export type ParsedJobHandlerPayload<PL> = { data: PL, logger: ConsolaInstance, job: Job }
export type ParsedJobHandler<Payload> = (props: ParsedJobHandlerPayload<Payload>) => Promise<void>
export type JobDefinition = RawJobHandler | { handler: RawJobHandler, maxConcurrency?: number }

export type WorkerDefinition = {
  [jobName: string]: JobDefinition | undefined
  catchAll?: JobDefinition
}

export type DefinedWorker = {
  queueName: string
  worker: Worker<never, void>
  definition: WorkerDefinition
}

export type ReadyWorker = () => DefinedWorker

export type Manifest = {
  workers: DefinedWorker[]
}
export type EmitOptions<T extends ZodSchema = ZodSchema> = {
  delay?: number
  deduplicationId?: string
  ttl?: number
  schema?: T
}

export interface WrappedQueue {
  emit<T extends ZodSchema>(
    name: string,
    payload: zInfer<T>,
    schema: T
  ): Promise<void>

  emit<T extends ZodSchema>(
    name: string,
    payload: zInfer<T>,
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    options: EmitOptions<T>
  ): Promise<void>

  emit(
    name: string,
    payload: never,
    options?: { delay?: number, deduplicationId?: string, ttl?: number }
  ): Promise<void>

  close(): Promise<void>
}

export type EventListener<Schema extends ZodSchema = ZodSchema> = {
  queueName: string
  eventName: string
  schema?: Schema
  handle: (payload: { data: zInfer<Schema> }) => Promise<void>
  trigger: (payload: zInfer<Schema>) => Promise<void>
}

// todo: decouple from BullMQ "job" instance
// export interface WorkerJob {
//   id: string
//   name: string
//   data: never
// }
