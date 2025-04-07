import { defineWorker } from '#imports'

export default defineWorker('default', {
  async test({ event, logger }) {
    logger.info(event.id, event.name, event.data)
  },
})
