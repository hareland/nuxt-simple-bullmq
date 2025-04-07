import { defineEventListener } from '#imports'

export default defineEventListener('name', {
  queueName: 'default',
  async handle(payload) {
    console.log('HELLO FROM THE LISTENER!', { payload })
  },
})
