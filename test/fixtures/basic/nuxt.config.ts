export default defineNuxtConfig({
  modules: ['../../../src/module'],
  devtools: { enabled: true },
  // runtimeConfig: {
  //   redis: {
  //     url: 'redis://localhost:6379',
  //   },
  // },
  compatibilityDate: '2025-04-04',
  bullMq: {
    workerDirs: ['./server/workers'],
  },
})
