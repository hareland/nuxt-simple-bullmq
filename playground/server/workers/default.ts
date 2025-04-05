import { defineWorker } from '#imports'

export default defineWorker('default', {
  async test({ job, logger }) {
    logger.info(job.id, job.name, job.data)
  },
})
