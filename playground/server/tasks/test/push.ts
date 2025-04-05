import { consola } from 'consola'

export default defineTask({
  meta: {
    name: 'test:push',
    description: 'Push a test job to the queue',
  },
  async run() {
    const logger = consola.withTag('test:push')
    const queue = useQueue('default')
    const payload = { message: 'LLAALAL' }
    logger.info(`emit: default.test`, { payload })
    await queue.emit('test', payload)
    return { result: 'Success' }
  },
})
