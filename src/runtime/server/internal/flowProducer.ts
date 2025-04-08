import { FlowProducer } from 'bullmq'
import type { FlowChildJob } from 'bullmq/dist/esm/interfaces/flow-job'

type WrappedFlowChildJob = Omit<FlowChildJob, 'queueName'> & { queueName?: string }

export const wrapFlowProducer = (queueName: string, producer: FlowProducer) => {
  return {
    add: async function (baseJobName: string, data: unknown, children: WrappedFlowChildJob[]) {
      await producer.add({
        name: baseJobName,
        queueName,
        data,
        children: children.map((child) => {
          if (!child.queueName) {
            return { ...child, queueName }
          }

          return child as FlowChildJob
        }),
      })
    },
  }
}

export const createBullMqFlowProducer = ({ redisUrl }: {
  redisUrl?: string
} = {}) => {
  return new FlowProducer({
    connection: {
      url: redisUrl,
      enableOfflineQueue: false,
    },
  })
}
