import { defineWorker } from '#imports'

export default defineWorker('default', {
  async test({ job, logger }) {
    const wait = async (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms))

    logger.info('Fetching lots of stuff...')
    while (job.progress !== 100) {
      await wait(5)
      await job.updateProgress(job.progress as number + 5)
    }
  },
})
