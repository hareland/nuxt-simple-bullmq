import type { Worker, Job } from 'bullmq'
import type { ConsolaInstance } from 'consola'

export type JobHandlerPayload = { job: Job, logger: ConsolaInstance }
export type JobHandler = (props: JobHandlerPayload) => Promise<never | void>
export type RawJobHandler = (props: JobHandlerPayload) => Promise<void>
export type ParsedJobHandlerPayload<PL> = { data: PL, logger: ConsolaInstance }
export type ParsedJobHandler<Payload> = (props: ParsedJobHandlerPayload<Payload>) => Promise<void>
export type JobDefinition = RawJobHandler | { handler: RawJobHandler }

export type WorkerDefinition = {
  [jobName: string]: JobDefinition
}

// ✅ use the generics here explicitly to match your instantiation
export type DefinedWorker = {
  queueName: string
  worker: Worker<never, void>
  definition: WorkerDefinition
}

export type ReadyWorker = () => DefinedWorker

export type Manifest = {
  workers: DefinedWorker[]
}
