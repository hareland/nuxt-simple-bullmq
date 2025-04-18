import type { Worker, Job, BackoffOptions } from 'bullmq'
import type { ConsolaInstance } from 'consola'
import type { ZodSchema, infer as zInfer } from 'zod'

export type JobHandlerPayload = { queueName: string, job: Job, logger: ConsolaInstance, lockId?: string }
// todo: move this somewhere else when real "EventListener" class is taken into use.
export type JobHandler = (props: JobHandlerPayload) => Promise<unknown> | Promise<void>
export type RawJobHandler = (props: JobHandlerPayload) => Promise<unknown> | Promise<void>
export type ParsedJobHandlerPayload<PL> = { data: PL } & JobHandlerPayload
export type ParsedJobHandler<Payload> = (props: ParsedJobHandlerPayload<Payload>) => Promise<void>
export type JobDefinition = RawJobHandler | { handler: RawJobHandler, maxConcurrency?: number }

export type WorkerDefinition = {
  [jobName: string]: JobDefinition | undefined
  catchAll?: JobDefinition
}

export type DefinedWorker = {
  queueName: string
  worker: Worker<unknown, void>
  definition: WorkerDefinition
}

export type ReadyWorker = () => DefinedWorker

export type Manifest = {
  workers: DefinedWorker[]
}
export type EmitOptions<T extends ZodSchema = ZodSchema> = {
  schema?: T
  delay?: number
  // todo: move this TTL and deduplicationId to dedicated "deduplication" object
  //  {deduplication?: {id?: string, ttl:number} | number}
  //    ^- if it is a number, we instantly just use the job name as the id
  ttl?: number // handles the ttl for deduplication
  deduplicationId?: string
  attempts?: number
  backoff?: BackoffOptions | number
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
    payload: unknown,
    options?: { delay?: number, deduplicationId?: string, ttl?: number }
  ): Promise<void>

  close(): Promise<void>
}

export type EventListener<Schema extends ZodSchema = ZodSchema> = {
  queueName: string
  eventName: string
  schema?: Schema
  handle: (payload: { data: Schema extends ZodSchema ? zInfer<Schema> : never }) => Promise<void>
  trigger: (payload: Schema extends ZodSchema ? zInfer<Schema> : never) => Promise<void>
}
